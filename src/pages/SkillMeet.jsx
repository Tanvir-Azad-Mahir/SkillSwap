import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Loader2,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Users,
  Video,
  VideoOff,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  supabase,
} from "../lib/supabase";

const ICE_SERVERS = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
    ],
  },
];

function getProfileName(profile) {
  return (
    profile?.full_name ||
    profile?.username ||
    "SkillSwap member"
  );
}

export default function SkillMeet() {
  const navigate =
    useNavigate();

  const {
    sessionType,
    sessionId,
  } =
    useParams();

  const localVideoRef =
    useRef(null);

  const remoteVideoRef =
    useRef(null);

  const localStreamRef =
    useRef(null);

  const peerConnectionRef =
    useRef(null);

  const channelRef =
    useRef(null);

  const candidateQueueRef =
    useRef([]);

  const offerSentRef =
    useRef(false);

  const screenTrackRef =
    useRef(null);

  const [
    user,
    setUser,
  ] =
    useState(null);

  const [
    meeting,
    setMeeting,
  ] =
    useState(null);

  const [
    counterpart,
    setCounterpart,
  ] =
    useState(null);

  const [
    isInitiator,
    setIsInitiator,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    joining,
    setJoining,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    connectionStatus,
    setConnectionStatus,
  ] =
    useState("Preparing SkillMeet");

  const [
    participantCount,
    setParticipantCount,
  ] =
    useState(1);

  const [
    micEnabled,
    setMicEnabled,
  ] =
    useState(true);

  const [
    cameraEnabled,
    setCameraEnabled,
  ] =
    useState(true);

  const [
    sharingScreen,
    setSharingScreen,
  ] =
    useState(false);

  const validSessionType =
    sessionType === "mentor" ||
    sessionType === "swap";

  /* =========================================================
     LOAD + AUTHORIZE ROOM
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadMeeting =
      async () => {
        try {
          setLoading(true);
          setError("");

          if (
            !validSessionType ||
            !sessionId
          ) {
            throw new Error(
              "Invalid SkillMeet room."
            );
          }

          const {
            data: {
              user:
                authUser,
            },
            error:
              authError,
          } =
            await supabase.auth.getUser();

          if (authError) {
            throw authError;
          }

          if (!authUser) {
            navigate(
              "/login",
              {
                replace: true,
              }
            );

            return;
          }

          if (cancelled) {
            return;
          }

          setUser(
            authUser
          );

          if (
            sessionType ===
            "mentor"
          ) {
            const {
              data:
                sessionData,
              error:
                sessionError,
            } =
              await supabase
                .from("sessions")
                .select(
                  `
                    id,
                    learner_id,
                    mentor_id,
                    skill_id,
                    title,
                    description,
                    scheduled_at,
                    duration_minutes,
                    status
                  `
                )
                .eq(
                  "id",
                  sessionId
                )
                .maybeSingle();

            if (
              sessionError
            ) {
              throw sessionError;
            }

            if (
              !sessionData
            ) {
              throw new Error(
                "SkillMeet session not found."
              );
            }

            const authorized =
              authUser.id ===
                sessionData.learner_id ||
              authUser.id ===
                sessionData.mentor_id;

            if (!authorized) {
              throw new Error(
                "You are not a participant in this SkillMeet session."
              );
            }

            const otherId =
              authUser.id ===
              sessionData.mentor_id
                ? sessionData.learner_id
                : sessionData.mentor_id;

            let otherProfile =
              null;

            if (otherId) {
              const {
                data,
                error:
                  profileError,
              } =
                await supabase
                  .from(
                    "profiles"
                  )
                  .select(
                    `
                      id,
                      username,
                      full_name,
                      avatar_url
                    `
                  )
                  .eq(
                    "id",
                    otherId
                  )
                  .maybeSingle();

              if (
                profileError
              ) {
                console.warn(
                  "SKILLMEET PROFILE LOAD:",
                  profileError
                );
              } else {
                otherProfile =
                  data || null;
              }
            }

            if (cancelled) {
              return;
            }

            setMeeting({
              ...sessionData,
              room_type:
                "mentor",
            });

            setCounterpart(
              otherProfile
            );

            setIsInitiator(
              authUser.id ===
                sessionData.mentor_id
            );
          } else {
            const {
              data:
                swapSession,
              error:
                swapSessionError,
            } =
              await supabase
                .from(
                  "swap_sessions"
                )
                .select(
                  `
                    id,
                    swap_id,
                    title,
                    description,
                    scheduled_at,
                    duration_minutes,
                    status,
                    created_by
                  `
                )
                .eq(
                  "id",
                  sessionId
                )
                .maybeSingle();

            if (
              swapSessionError
            ) {
              throw swapSessionError;
            }

            if (
              !swapSession
            ) {
              throw new Error(
                "SkillMeet swap session not found."
              );
            }

            const {
              data:
                swapData,
              error:
                swapError,
            } =
              await supabase
                .from(
                  "skill_swaps"
                )
                .select(
                  `
                    id,
                    requester_id,
                    partner_id,
                    requester_teaches_skill_id,
                    partner_teaches_skill_id,
                    status
                  `
                )
                .eq(
                  "id",
                  swapSession.swap_id
                )
                .maybeSingle();

            if (swapError) {
              throw swapError;
            }

            if (!swapData) {
              throw new Error(
                "The skill swap for this meeting could not be found."
              );
            }

            const authorized =
              authUser.id ===
                swapData.requester_id ||
              authUser.id ===
                swapData.partner_id;

            if (!authorized) {
              throw new Error(
                "You are not a participant in this SkillMeet swap session."
              );
            }

            const otherId =
              authUser.id ===
              swapData.requester_id
                ? swapData.partner_id
                : swapData.requester_id;

            let otherProfile =
              null;

            if (otherId) {
              const {
                data,
                error:
                  profileError,
              } =
                await supabase
                  .from(
                    "profiles"
                  )
                  .select(
                    `
                      id,
                      username,
                      full_name,
                      avatar_url
                    `
                  )
                  .eq(
                    "id",
                    otherId
                  )
                  .maybeSingle();

              if (
                profileError
              ) {
                console.warn(
                  "SKILLMEET SWAP PROFILE LOAD:",
                  profileError
                );
              } else {
                otherProfile =
                  data || null;
              }
            }

            if (cancelled) {
              return;
            }

            setMeeting({
              ...swapSession,
              ...swapData,
              room_type:
                "swap",
            });

            setCounterpart(
              otherProfile
            );

            setIsInitiator(
              authUser.id ===
                swapData.requester_id
            );
          }
        } catch (err) {
          console.error(
            "SKILLMEET LOAD ERROR:",
            err
          );

          if (!cancelled) {
            setError(
              err?.message ||
                "SkillMeet could not be loaded."
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    loadMeeting();

    return () => {
      cancelled = true;
    };
  }, [
    navigate,
    sessionId,
    sessionType,
    validSessionType,
  ]);

  /* =========================================================
     REALTIME + WEBRTC HELPERS
  ========================================================= */

  const sendSignal =
    useCallback(
      async (
        event,
        payload = {}
      ) => {
        const channel =
          channelRef.current;

        if (
          !channel ||
          !user
        ) {
          return;
        }

        await channel.send({
          type:
            "broadcast",
          event,
          payload: {
            ...payload,
            sender:
              user.id,
          },
        });
      },
      [user]
    );

  const flushCandidates =
    useCallback(
      async (
        peer
      ) => {
        const queued =
          candidateQueueRef.current;

        candidateQueueRef.current =
          [];

        for (
          const candidate
          of queued
        ) {
          try {
            await peer.addIceCandidate(
              new RTCIceCandidate(
                candidate
              )
            );
          } catch (err) {
            console.warn(
              "SKILLMEET ICE QUEUE ERROR:",
              err
            );
          }
        }
      },
      []
    );

  const createPeerConnection =
    useCallback(
      () => {
        if (
          peerConnectionRef.current
        ) {
          return peerConnectionRef.current;
        }

        const peer =
          new RTCPeerConnection(
            {
              iceServers:
                ICE_SERVERS,
            }
          );

        const localStream =
          localStreamRef.current;

        if (localStream) {
          localStream
            .getTracks()
            .forEach(
              (track) => {
                peer.addTrack(
                  track,
                  localStream
                );
              }
            );
        }

        peer.ontrack =
          (event) => {
            const [
              remoteStream,
            ] =
              event.streams;

            if (
              remoteVideoRef.current &&
              remoteStream
            ) {
              remoteVideoRef.current.srcObject =
                remoteStream;
            }
          };

        peer.onicecandidate =
          (event) => {
            if (
              event.candidate
            ) {
              sendSignal(
                "ice-candidate",
                {
                  candidate:
                    event.candidate.toJSON(),
                }
              ).catch(
                (err) =>
                  console.warn(
                    "SKILLMEET ICE SEND:",
                    err
                  )
              );
            }
          };

        peer.onconnectionstatechange =
          () => {
            const state =
              peer.connectionState;

            if (
              state ===
              "connected"
            ) {
              setConnectionStatus(
                "Connected"
              );
            } else if (
              state ===
              "connecting"
            ) {
              setConnectionStatus(
                "Connecting"
              );
            } else if (
              state ===
                "disconnected" ||
              state ===
                "failed"
            ) {
              setConnectionStatus(
                "Connection interrupted"
              );
            } else if (
              state ===
              "closed"
            ) {
              setConnectionStatus(
                "Call ended"
              );
            }
          };

        peerConnectionRef.current =
          peer;

        return peer;
      },
      [sendSignal]
    );

  const createOffer =
    useCallback(
      async () => {
        if (
          offerSentRef.current
        ) {
          return;
        }

        const peer =
          createPeerConnection();

        try {
          offerSentRef.current =
            true;

          setConnectionStatus(
            "Calling participant"
          );

          const offer =
            await peer.createOffer();

          await peer.setLocalDescription(
            offer
          );

          await sendSignal(
            "offer",
            {
              sdp:
                peer.localDescription,
            }
          );
        } catch (err) {
          offerSentRef.current =
            false;

          console.error(
            "SKILLMEET OFFER ERROR:",
            err
          );

          setError(
            "The SkillMeet connection could not be started."
          );
        }
      },
      [
        createPeerConnection,
        sendSignal,
      ]
    );

  /* =========================================================
     START MEDIA + REALTIME ROOM
  ========================================================= */

  useEffect(() => {
    if (
      !user ||
      !meeting ||
      loading
    ) {
      return undefined;
    }

    let disposed =
      false;

    let roomChannel =
      null;

    const start =
      async () => {
        try {
          setJoining(
            true
          );

          setError("");

          setConnectionStatus(
            "Requesting camera and microphone"
          );

          const localStream =
            await navigator.mediaDevices.getUserMedia(
              {
                video: true,
                audio: true,
              }
            );

          if (disposed) {
            localStream
              .getTracks()
              .forEach(
                (track) =>
                  track.stop()
              );

            return;
          }

          localStreamRef.current =
            localStream;

          if (
            localVideoRef.current
          ) {
            localVideoRef.current.srcObject =
              localStream;
          }

          const roomName =
            `skillmeet:${sessionType}:${sessionId}`;

          roomChannel =
            supabase.channel(
              roomName,
              {
                config: {
                  presence: {
                    key:
                      user.id,
                  },
                },
              }
            );

          channelRef.current =
            roomChannel;

          roomChannel
            .on(
              "broadcast",
              {
                event:
                  "offer",
              },
              async ({
                payload,
              }) => {
                if (
                  payload?.sender ===
                  user.id
                ) {
                  return;
                }

                try {
                  const peer =
                    createPeerConnection();

                  await peer.setRemoteDescription(
                    new RTCSessionDescription(
                      payload.sdp
                    )
                  );

                  await flushCandidates(
                    peer
                  );

                  const answer =
                    await peer.createAnswer();

                  await peer.setLocalDescription(
                    answer
                  );

                  await sendSignal(
                    "answer",
                    {
                      sdp:
                        peer.localDescription,
                    }
                  );

                  setConnectionStatus(
                    "Connecting"
                  );
                } catch (err) {
                  console.error(
                    "SKILLMEET ANSWER ERROR:",
                    err
                  );

                  setError(
                    "Could not answer the SkillMeet call."
                  );
                }
              }
            )
            .on(
              "broadcast",
              {
                event:
                  "answer",
              },
              async ({
                payload,
              }) => {
                if (
                  payload?.sender ===
                  user.id
                ) {
                  return;
                }

                const peer =
                  peerConnectionRef.current;

                if (!peer) {
                  return;
                }

                try {
                  await peer.setRemoteDescription(
                    new RTCSessionDescription(
                      payload.sdp
                    )
                  );

                  await flushCandidates(
                    peer
                  );

                  setConnectionStatus(
                    "Connecting"
                  );
                } catch (err) {
                  console.error(
                    "SKILLMEET REMOTE ANSWER ERROR:",
                    err
                  );
                }
              }
            )
            .on(
              "broadcast",
              {
                event:
                  "ice-candidate",
              },
              async ({
                payload,
              }) => {
                if (
                  payload?.sender ===
                    user.id ||
                  !payload?.candidate
                ) {
                  return;
                }

                const peer =
                  createPeerConnection();

                if (
                  peer.remoteDescription
                ) {
                  try {
                    await peer.addIceCandidate(
                      new RTCIceCandidate(
                        payload.candidate
                      )
                    );
                  } catch (err) {
                    console.warn(
                      "SKILLMEET ICE ADD:",
                      err
                    );
                  }
                } else {
                  candidateQueueRef.current.push(
                    payload.candidate
                  );
                }
              }
            )
            .on(
              "broadcast",
              {
                event:
                  "leave",
              },
              ({
                payload,
              }) => {
                if (
                  payload?.sender ===
                  user.id
                ) {
                  return;
                }

                setConnectionStatus(
                  `${getProfileName(
                    counterpart
                  )} left the meeting`
                );

                setParticipantCount(
                  1
                );

                if (
                  remoteVideoRef.current
                ) {
                  remoteVideoRef.current.srcObject =
                    null;
                }
              }
            )
            .on(
              "presence",
              {
                event:
                  "sync",
              },
              () => {
                const state =
                  roomChannel.presenceState();

                const count =
                  Object.values(
                    state
                  ).reduce(
                    (
                      total,
                      entries
                    ) =>
                      total +
                      entries.length,
                    0
                  );

                setParticipantCount(
                  Math.max(
                    count,
                    1
                  )
                );

                if (
                  count > 1
                ) {
                  setConnectionStatus(
                    "Participant joined"
                  );

                  if (
                    isInitiator &&
                    !offerSentRef.current
                  ) {
                    window.setTimeout(
                      () => {
                        createOffer();
                      },
                      250
                    );
                  }
                } else {
                  setConnectionStatus(
                    "Waiting for participant"
                  );
                }
              }
            );

          roomChannel.subscribe(
            async (
              status
            ) => {
              if (
                status ===
                "SUBSCRIBED"
              ) {
                await roomChannel.track(
                  {
                    user_id:
                      user.id,
                    joined_at:
                      new Date().toISOString(),
                  }
                );

                setConnectionStatus(
                  "Waiting for participant"
                );

                setJoining(
                  false
                );

                const tableName =
                  sessionType ===
                  "swap"
                    ? "swap_sessions"
                    : "sessions";

                const {
                  error:
                    timestampError,
                } =
                  await supabase
                    .from(
                      tableName
                    )
                    .update({
                      meeting_started_at:
                        new Date().toISOString(),
                    })
                    .eq(
                      "id",
                      sessionId
                    )
                    .is(
                      "meeting_started_at",
                      null
                    );

                if (
                  timestampError
                ) {
                  console.warn(
                    "SKILLMEET START TIMESTAMP:",
                    timestampError
                  );
                }
              }
            }
          );
        } catch (err) {
          console.error(
            "SKILLMEET START ERROR:",
            err
          );

          setJoining(
            false
          );

          setError(
            err?.name ===
              "NotAllowedError"
              ? "Camera or microphone permission was denied. Allow access and reopen SkillMeet."
              : err?.message ||
                  "Could not start camera and microphone."
          );
        }
      };

    start();

    return () => {
      disposed =
        true;

      try {
        peerConnectionRef.current?.close();
      } catch {
        // Ignore cleanup errors.
      }

      peerConnectionRef.current =
        null;

      localStreamRef.current
        ?.getTracks()
        .forEach(
          (track) =>
            track.stop()
        );

      localStreamRef.current =
        null;

      if (roomChannel) {
        roomChannel
          .untrack()
          .catch(
            () => {}
          );

        supabase.removeChannel(
          roomChannel
        );
      }

      channelRef.current =
        null;
    };
  }, [
    counterpart,
    createOffer,
    createPeerConnection,
    flushCandidates,
    isInitiator,
    loading,
    meeting,
    sendSignal,
    sessionId,
    sessionType,
    user,
  ]);

  /* =========================================================
     CONTROLS
  ========================================================= */

  const toggleMicrophone =
    () => {
      const audioTracks =
        localStreamRef.current
          ?.getAudioTracks() ||
        [];

      const next =
        !micEnabled;

      audioTracks.forEach(
        (track) => {
          track.enabled =
            next;
        }
      );

      setMicEnabled(
        next
      );
    };

  const toggleCamera =
    () => {
      const videoTracks =
        localStreamRef.current
          ?.getVideoTracks() ||
        [];

      const next =
        !cameraEnabled;

      videoTracks.forEach(
        (track) => {
          if (
            track !==
            screenTrackRef.current
          ) {
            track.enabled =
              next;
          }
        }
      );

      setCameraEnabled(
        next
      );
    };

  const stopScreenShare =
    useCallback(
      async () => {
        const peer =
          peerConnectionRef.current;

        const stream =
          localStreamRef.current;

        const cameraTrack =
          stream
            ?.getVideoTracks()
            .find(
              (track) =>
                track !==
                screenTrackRef.current
            );

        if (
          peer &&
          cameraTrack
        ) {
          const sender =
            peer
              .getSenders()
              .find(
                (item) =>
                  item.track?.kind ===
                  "video"
              );

          if (sender) {
            await sender.replaceTrack(
              cameraTrack
            );
          }
        }

        if (
          screenTrackRef.current
        ) {
          screenTrackRef.current.onended =
            null;

          screenTrackRef.current.stop();

          screenTrackRef.current =
            null;
        }

        if (
          localVideoRef.current &&
          stream
        ) {
          localVideoRef.current.srcObject =
            stream;
        }

        setSharingScreen(
          false
        );
      },
      []
    );

  const toggleScreenShare =
    async () => {
      if (sharingScreen) {
        await stopScreenShare();
        return;
      }

      try {
        const screenStream =
          await navigator.mediaDevices.getDisplayMedia(
            {
              video: true,
              audio: false,
            }
          );

        const [
          screenTrack,
        ] =
          screenStream.getVideoTracks();

        if (!screenTrack) {
          return;
        }

        const peer =
          createPeerConnection();

        const sender =
          peer
            .getSenders()
            .find(
              (item) =>
                item.track?.kind ===
                "video"
            );

        if (sender) {
          await sender.replaceTrack(
            screenTrack
          );
        }

        screenTrackRef.current =
          screenTrack;

        screenTrack.onended =
          () => {
            stopScreenShare();
          };

        if (
          localVideoRef.current
        ) {
          localVideoRef.current.srcObject =
            screenStream;
        }

        setSharingScreen(
          true
        );
      } catch (err) {
        if (
          err?.name !==
          "NotAllowedError"
        ) {
          setError(
            err?.message ||
              "Screen sharing could not start."
          );
        }
      }
    };

  const leaveMeeting =
    async () => {
      try {
        await sendSignal(
          "leave"
        );
      } catch {
        // Leave even if the signal could not be sent.
      }

      try {
        peerConnectionRef.current?.close();
      } catch {
        // Ignore close errors.
      }

      localStreamRef.current
        ?.getTracks()
        .forEach(
          (track) =>
            track.stop()
        );

      if (
        channelRef.current
      ) {
        try {
          await channelRef.current.untrack();
        } catch {
          // Ignore presence cleanup errors.
        }

        await supabase.removeChannel(
          channelRef.current
        );
      }

      navigate(
        "/sessions"
      );
    };

  /* =========================================================
     LOADING / ERROR
  ========================================================= */

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#060807] text-[#f2f4ef]">
        <div className="text-center">
          <Loader2
            size={28}
            className="mx-auto animate-spin text-[#c7ff39]"
          />

          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[#a1a1aa]">
            Loading SkillMeet
          </p>
        </div>
      </main>
    );
  }

  if (
    error &&
    !meeting
  ) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#060807] px-5 text-[#f2f4ef]">
        <div className="w-full max-w-lg border border-[#ff6b6b]/30 bg-[#0a0d0b] p-7 text-center">
          <p className="text-sm leading-7 text-[#ff8b8b]">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/sessions"
              )
            }
            className="mt-5 inline-flex min-h-10 items-center gap-2 border border-white/10 px-4 text-xs text-[#a1a1aa] hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
          >
            <ArrowLeft
              size={14}
            />
            Back to sessions
          </button>
        </div>
      </main>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#060807] text-[#f2f4ef]">
      <header className="border-b border-white/10 bg-[#060807]/95">
        <div className="mx-auto flex min-h-[68px] max-w-[1600px] items-center justify-between gap-4 px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={
                leaveMeeting
              }
              className="grid h-10 w-10 shrink-0 place-items-center border border-white/10 text-[#a1a1aa] hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
            >
              <ArrowLeft
                size={16}
              />
            </button>

            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.17em] text-[#c7ff39]">
                SkillMeet
              </p>

              <h1 className="truncate text-base font-medium md:text-lg">
                {meeting?.title ||
                  (sessionType ===
                  "swap"
                    ? "Skill Swap Meeting"
                    : "Mentorship Session")}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-[#a1a1aa] sm:inline">
              {connectionStatus}
            </span>

            <span className="inline-flex items-center gap-1.5 border border-white/10 px-3 py-2 text-xs text-[#a1a1aa]">
              <Users
                size={13}
              />
              {participantCount}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-5 py-6 md:px-8">
        {error && (
          <div className="mb-5 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]">
            {error}
          </div>
        )}

        <section className="relative overflow-hidden border border-white/10 bg-[#020403]">
          <div className="relative aspect-video min-h-[360px] w-full">
            <video
              ref={
                remoteVideoRef
              }
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />

            {participantCount <
              2 && (
              <div className="absolute inset-0 grid place-items-center bg-[#050706]">
                <div className="text-center">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-white/10 bg-white/[0.025] text-2xl font-semibold text-[#c7ff39]">
                    {getProfileName(
                      counterpart
                    )
                      .slice(
                        0,
                        1
                      )
                      .toUpperCase()}
                  </div>

                  <h2 className="mt-5 text-xl font-medium">
                    Waiting for{" "}
                    {getProfileName(
                      counterpart
                    )}
                  </h2>

                  <p className="mt-2 text-sm text-[#a1a1aa]">
                    The call will connect automatically when the other participant joins.
                  </p>
                </div>
              </div>
            )}

            <div className="absolute bottom-4 right-4 w-[26%] min-w-[150px] max-w-[300px] overflow-hidden border border-white/15 bg-black shadow-2xl">
              <div className="aspect-video">
                <video
                  ref={
                    localVideoRef
                  }
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-black/55 px-3 py-2 text-[10px] text-white/80">
                You
                {sharingScreen
                  ? " · Sharing screen"
                  : ""}
              </div>
            </div>

            {joining && (
              <div className="absolute inset-0 grid place-items-center bg-[#060807]/85">
                <div className="text-center">
                  <Loader2
                    size={26}
                    className="mx-auto animate-spin text-[#c7ff39]"
                  />

                  <p className="mt-4 text-xs uppercase tracking-[0.15em] text-[#a1a1aa]">
                    Joining SkillMeet
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-white/10 bg-[#0a0d0b] px-4 py-4">
            <button
              type="button"
              onClick={
                toggleMicrophone
              }
              className={`grid h-12 w-12 place-items-center rounded-full border transition ${
                micEnabled
                  ? "border-white/10 bg-white/[0.04] text-white hover:border-[#c7ff39]/30"
                  : "border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.08] text-[#ff8b8b]"
              }`}
              title={
                micEnabled
                  ? "Mute microphone"
                  : "Unmute microphone"
              }
            >
              {micEnabled ? (
                <Mic
                  size={18}
                />
              ) : (
                <MicOff
                  size={18}
                />
              )}
            </button>

            <button
              type="button"
              onClick={
                toggleCamera
              }
              className={`grid h-12 w-12 place-items-center rounded-full border transition ${
                cameraEnabled
                  ? "border-white/10 bg-white/[0.04] text-white hover:border-[#c7ff39]/30"
                  : "border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.08] text-[#ff8b8b]"
              }`}
              title={
                cameraEnabled
                  ? "Turn camera off"
                  : "Turn camera on"
              }
            >
              {cameraEnabled ? (
                <Video
                  size={18}
                />
              ) : (
                <VideoOff
                  size={18}
                />
              )}
            </button>

            <button
              type="button"
              onClick={
                toggleScreenShare
              }
              className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-5 text-xs transition ${
                sharingScreen
                  ? "border-[#c7ff39]/30 bg-[#c7ff39]/[0.08] text-[#c7ff39]"
                  : "border-white/10 bg-white/[0.04] text-white hover:border-[#c7ff39]/30"
              }`}
            >
              <MonitorUp
                size={17}
              />

              {sharingScreen
                ? "Stop sharing"
                : "Share screen"}
            </button>

            <button
              type="button"
              onClick={
                leaveMeeting
              }
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#ff5f57] px-6 text-xs font-semibold text-white transition hover:opacity-90"
            >
              <PhoneOff
                size={17}
              />
              Leave
            </button>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="border border-white/10 bg-[#0a0d0b]/70 p-4">
            <p className="text-[9px] uppercase tracking-[0.14em] text-white/35">
              Meeting type
            </p>

            <p className="mt-2 text-sm">
              {sessionType ===
              "swap"
                ? "Skill Swap"
                : "Mentorship"}
            </p>
          </div>

          <div className="border border-white/10 bg-[#0a0d0b]/70 p-4">
            <p className="text-[9px] uppercase tracking-[0.14em] text-white/35">
              Participant
            </p>

            <p className="mt-2 text-sm">
              {getProfileName(
                counterpart
              )}
            </p>
          </div>

          <div className="border border-white/10 bg-[#0a0d0b]/70 p-4">
            <p className="text-[9px] uppercase tracking-[0.14em] text-white/35">
              Room
            </p>

            <p className="mt-2 truncate text-sm text-[#c7ff39]">
              {sessionId}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
