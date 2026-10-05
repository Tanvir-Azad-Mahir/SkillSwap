import {

  useCallback,

  useEffect,

  useRef,

  useState,

} from "react";

import { useTheme } from "../lib/ThemeContext";



import {

  ArrowLeft,

  Loader2,

  Mic,

  MicOff,

  MonitorUp,

  PhoneOff,

  Radio,

  ShieldCheck,

  Sparkles,

  Users,

  Video,

  VideoOff,

} from "lucide-react";



import {

  useNavigate,

  useParams,

} from "react-router-dom";



import { supabase } from "../lib/supabase";



/* =========================================================

   WEBRTC CONFIG

   ---------------------------------------------------------

   STUN discovers public addresses. TURN relays media when a

   direct path is impossible, which is required for reliable

   calls across mobile, office, university and CGNAT networks.



   Configure these in Netlify Environment Variables:



   VITE_TURN_URL=turn:turn.example.com:3478?transport=udp,turn:turn.example.com:3478?transport=tcp,turns:turn.example.com:5349?transport=tcp

   VITE_TURN_USERNAME=your_username

   VITE_TURN_CREDENTIAL=your_password



   Optional diagnostic flag:

   VITE_FORCE_TURN=true

\========================================================= */



function buildIceServers() {

  const servers = [

    {

      urls: [

        "stun:stun.l.google.com:19302",

        "stun:stun1.l.google.com:19302",

        "stun:stun2.l.google.com:19302",

        "stun:stun3.l.google.com:19302",

      ],

    },

  ];



  const turnUrl =

    import.meta.env.VITE_TURN_URL?.trim();



  const turnUsername =

    import.meta.env.VITE_TURN_USERNAME?.trim();



  const turnCredential =

    import.meta.env.VITE_TURN_CREDENTIAL?.trim();



  if (turnUrl) {

    servers.push({

      urls: turnUrl

        .split(",")

        .map((value) => value.trim())

        .filter(Boolean),

      username: turnUsername || "",

      credential: turnCredential || "",

    });

  }



  return servers;

}



const ICE_SERVERS = buildIceServers();

const HAS_TURN = ICE_SERVERS.some((server) => {

  const urls = Array.isArray(server.urls)

    ? server.urls

    : [server.urls];



  return urls.some((url) =>

    String(url || "").startsWith("turn")

  );

});



const FORCE_TURN =

  String(import.meta.env.VITE_FORCE_TURN || "")

    .trim()

    .toLowerCase() === "true";



if (import.meta.env.PROD && !HAS_TURN) {

  console.warn(

    "SkillMeet is running without TURN. Calls may fail between different networks."

  );

}



function getProfileName(profile) {

  return (

    profile?.full_name ||

    profile?.username ||

    "SkillSwap member"

  );

}



export default function SkillMeet() {

  const navigate = useNavigate();

  const { sessionType, sessionId } = useParams();
  const { resolvedTheme } = useTheme();



  const localVideoRef = useRef(null);

  const remoteVideoRef = useRef(null);



  const localStreamRef = useRef(null);

  const remoteStreamRef = useRef(null);



  const peerConnectionRef = useRef(null);

  const channelRef = useRef(null);



  const userRef = useRef(null);

  const counterpartRef = useRef(null);

  const isInitiatorRef = useRef(false);



  const offerInFlightRef = useRef(false);

  const offerSentRef = useRef(false);

  const reconnectTimerRef = useRef(null);

  const screenTrackRef = useRef(null);

  const leavingRef = useRef(false);

  const pendingIceCandidatesRef = useRef([]);



  const [user, setUser] = useState(null);

  const [meeting, setMeeting] = useState(null);

  const [counterpart, setCounterpart] = useState(null);

  const [isInitiator, setIsInitiator] = useState(false);



  const [loading, setLoading] = useState(true);

  const [joining, setJoining] = useState(true);

  const [error, setError] = useState("");



  const [connectionStatus, setConnectionStatus] =

    useState("Preparing SkillMeet");



  const [participantCount, setParticipantCount] =

    useState(1);



  const [micEnabled, setMicEnabled] = useState(true);

  const [cameraEnabled, setCameraEnabled] =

    useState(true);

  const [sharingScreen, setSharingScreen] =

    useState(false);



  const validSessionType =

    sessionType === "mentor" ||

    sessionType === "swap";



  useEffect(() => {

    userRef.current = user;

  }, [user]);



  useEffect(() => {

    counterpartRef.current = counterpart;

  }, [counterpart]);



  useEffect(() => {

    isInitiatorRef.current = isInitiator;

  }, [isInitiator]);



  /* =========================================================

     LOAD + AUTHORIZE ROOM

  ========================================================= */



  useEffect(() => {

    let cancelled = false;



    const loadMeeting = async () => {

      try {

        setLoading(true);

        setError("");



        if (!validSessionType || !sessionId) {

          throw new Error("Invalid SkillMeet room.");

        }



        const {

          data: { user: authUser },

          error: authError,

        } = await supabase.auth.getUser();



        if (authError) {

          throw authError;

        }



        if (!authUser) {

          navigate("/login", { replace: true });

          return;

        }



        if (cancelled) {

          return;

        }



        setUser(authUser);

        userRef.current = authUser;



        if (sessionType === "mentor") {

          const {

            data: sessionData,

            error: sessionError,

          } = await supabase

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

            .eq("id", sessionId)

            .maybeSingle();



          if (sessionError) {

            throw sessionError;

          }



          if (!sessionData) {

            throw new Error(

              "SkillMeet session not found."

            );

          }



          const authorized =

            authUser.id === sessionData.learner_id ||

            authUser.id === sessionData.mentor_id;



          if (!authorized) {

            throw new Error(

              "You are not a participant in this SkillMeet session."

            );

          }



          const otherId =

            authUser.id === sessionData.mentor_id

              ? sessionData.learner_id

              : sessionData.mentor_id;



          let otherProfile = null;



          if (otherId) {

            const {

              data,

              error: profileError,

            } = await supabase

              .from("profiles")

              .select(

                `

                  id,

                  username,

                  full_name,

                  avatar_url

                `

              )

              .eq("id", otherId)

              .maybeSingle();



            if (profileError) {

              console.warn(

                "SKILLMEET PROFILE LOAD:",

                profileError

              );

            } else {

              otherProfile = data || null;

            }

          }



          if (cancelled) {

            return;

          }



          const initiator =

            authUser.id === sessionData.mentor_id;



          setMeeting({

            ...sessionData,

            room_type: "mentor",

          });



          setCounterpart(otherProfile);

          counterpartRef.current = otherProfile;



          setIsInitiator(initiator);

          isInitiatorRef.current = initiator;

        } else {

          const {

            data: swapSession,

            error: swapSessionError,

          } = await supabase

            .from("swap_sessions")

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

            .eq("id", sessionId)

            .maybeSingle();



          if (swapSessionError) {

            throw swapSessionError;

          }



          if (!swapSession) {

            throw new Error(

              "SkillMeet swap session not found."

            );

          }



          const {

            data: swapData,

            error: swapError,

          } = await supabase

            .from("skill_swaps")

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

            .eq("id", swapSession.swap_id)

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

            authUser.id === swapData.requester_id ||

            authUser.id === swapData.partner_id;



          if (!authorized) {

            throw new Error(

              "You are not a participant in this SkillMeet swap session."

            );

          }



          const otherId =

            authUser.id === swapData.requester_id

              ? swapData.partner_id

              : swapData.requester_id;



          let otherProfile = null;



          if (otherId) {

            const {

              data,

              error: profileError,

            } = await supabase

              .from("profiles")

              .select(

                `

                  id,

                  username,

                  full_name,

                  avatar_url

                `

              )

              .eq("id", otherId)

              .maybeSingle();



            if (profileError) {

              console.warn(

                "SKILLMEET SWAP PROFILE LOAD:",

                profileError

              );

            } else {

              otherProfile = data || null;

            }

          }



          if (cancelled) {

            return;

          }



          const initiator =

            authUser.id === swapData.requester_id;



          setMeeting({

            ...swapSession,

            ...swapData,

            room_type: "swap",

          });



          setCounterpart(otherProfile);

          counterpartRef.current = otherProfile;



          setIsInitiator(initiator);

          isInitiatorRef.current = initiator;

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

     REALTIME SIGNALING

  ========================================================= */



  const sendSignal = useCallback(

    async (event, payload = {}) => {

      const channel = channelRef.current;

      const currentUser = userRef.current;



      if (!channel || !currentUser) {

        throw new Error(

          "SkillMeet signaling channel is not ready."

        );

      }



      const result = await channel.send({

        type: "broadcast",

        event,

        payload: {

          ...payload,

          sender: currentUser.id,

        },

      });



      if (result !== "ok") {

        console.warn(

          "SKILLMEET SIGNAL SEND:",

          event,

          result

        );

      }



      return result;

    },

    []

  );



  const clearReconnectTimer = useCallback(() => {

    if (reconnectTimerRef.current) {

      window.clearTimeout(

        reconnectTimerRef.current

      );

      reconnectTimerRef.current = null;

    }

  }, []);



  const attachRemoteTrack = useCallback(

    (event) => {

      if (!remoteStreamRef.current) {

        remoteStreamRef.current =

          new MediaStream();

      }



      const targetStream =

        remoteStreamRef.current;



      const incomingTracks =

        event.streams?.[0]?.getTracks?.() ||

        [event.track];



      incomingTracks

        .filter(Boolean)

        .forEach((track) => {

          const alreadyAdded =

            targetStream

              .getTracks()

              .some(

                (existing) =>

                  existing.id === track.id

              );



          if (!alreadyAdded) {

            targetStream.addTrack(track);

          }

        });



      if (remoteVideoRef.current) {

        remoteVideoRef.current.srcObject =

          targetStream;



        remoteVideoRef.current

          .play()

          .catch(() => {

            // Browser may wait for user interaction.

          });

      }

    },

    []

  );



  const flushPendingIceCandidates = useCallback(

    async (peer) => {

      if (!peer?.remoteDescription?.type) {

        return;

      }



      const queued = pendingIceCandidatesRef.current;

      pendingIceCandidatesRef.current = [];



      for (const candidate of queued) {

        try {

          await peer.addIceCandidate(candidate);

        } catch (err) {

          console.warn(

            "SKILLMEET QUEUED ICE CANDIDATE ERROR:",

            err

          );

        }

      }

    },

    []

  );



  const createPeerConnection = useCallback(() => {

    const existing = peerConnectionRef.current;



    if (

      existing &&

      existing.connectionState !== "closed"

    ) {

      return existing;

    }



    const peer = new RTCPeerConnection({

      iceServers: ICE_SERVERS,

      iceTransportPolicy: FORCE_TURN ? "relay" : "all",

      iceCandidatePoolSize: 10,

      bundlePolicy: "max-bundle",

      rtcpMuxPolicy: "require",

    });



    const localStream = localStreamRef.current;



    if (localStream) {

      localStream.getTracks().forEach((track) => {

        peer.addTrack(track, localStream);

      });

    }



    peer.ontrack = attachRemoteTrack;



    peer.onicecandidate = (event) => {

      if (!event.candidate) {

        return;

      }



      const candidate =

        typeof event.candidate.toJSON === "function"

          ? event.candidate.toJSON()

          : {

              candidate: event.candidate.candidate,

              sdpMid: event.candidate.sdpMid,

              sdpMLineIndex: event.candidate.sdpMLineIndex,

              usernameFragment: event.candidate.usernameFragment,

            };



      sendSignal("ice-candidate", {

        candidate,

      }).catch((err) => {

        console.warn(

          "SKILLMEET ICE CANDIDATE SEND ERROR:",

          err

        );

      });

    };



    peer.oniceconnectionstatechange = () => {

      console.log(

        "SKILLMEET ICE STATE:",

        peer.iceConnectionState

      );

    };



    peer.onicegatheringstatechange = () => {

      console.log(

        "SKILLMEET ICE GATHERING:",

        peer.iceGatheringState

      );

    };



    peer.onicecandidateerror = (event) => {

      console.warn(

        "SKILLMEET ICE CANDIDATE ERROR:",

        event

      );

    };



    peer.onconnectionstatechange = () => {

      const state = peer.connectionState;



      console.log(

        "SKILLMEET CONNECTION STATE:",

        state

      );



      if (state === "connected") {

        clearReconnectTimer();

        setConnectionStatus("Connected");

        setError("");

        return;

      }



      if (

        state === "new" ||

        state === "connecting"

      ) {

        setConnectionStatus("Connecting");

        return;

      }



      if (state === "disconnected") {

        setConnectionStatus("Reconnecting…");



        clearReconnectTimer();



        reconnectTimerRef.current =

          window.setTimeout(() => {

            if (

              peer.connectionState ===

                "disconnected" &&

              isInitiatorRef.current

            ) {

              offerSentRef.current = false;

              offerInFlightRef.current = false;



              peer.restartIce?.();



              window.dispatchEvent(

                new CustomEvent(

                  "skillmeet-restart-ice"

                )

              );

            }

          }, 5000);



        return;

      }



      if (state === "failed") {

        clearReconnectTimer();

        setConnectionStatus(

          "Connection failed"

        );



        setError(

          HAS_TURN

            ? "The browsers reached the same SkillMeet room, but media could not connect. Check the TURN server URL, credentials, and network access."

            : "The browsers reached the same SkillMeet room, but the direct media connection failed. Configure a TURN server for reliable calls across different networks."

        );



        if (isInitiatorRef.current) {

          offerSentRef.current = false;

          offerInFlightRef.current = false;



          peer.restartIce?.();



          window.setTimeout(() => {

            window.dispatchEvent(

              new CustomEvent(

                "skillmeet-restart-ice"

              )

            );

          }, 800);

        }



        return;

      }



      if (state === "closed") {

        clearReconnectTimer();

        setConnectionStatus("Call ended");

      }

    };



    peerConnectionRef.current = peer;

    return peer;

  }, [

    attachRemoteTrack,

    clearReconnectTimer,

    sendSignal,

  ]);



  const createOffer = useCallback(

    async ({ iceRestart = false } = {}) => {

      if (offerInFlightRef.current) {

        return;

      }



      const peer = createPeerConnection();



      if (peer.signalingState !== "stable") {

        return;

      }



      try {

        offerInFlightRef.current = true;

        setConnectionStatus(

          iceRestart

            ? "Reconnecting…"

            : "Calling participant"

        );



        const offer = await peer.createOffer({

          iceRestart,

        });



        await peer.setLocalDescription(offer);



        /*

          Send the offer immediately and relay ICE candidates

          as they are gathered. The receiving peer queues early

          candidates until the remote description is applied.

        */

        if (!peer.localDescription) {

          throw new Error(

            "Local WebRTC offer was not created."

          );

        }



        await sendSignal("offer", {

          sdp: {

            type: peer.localDescription.type,

            sdp: peer.localDescription.sdp,

          },

          iceRestart,

        });



        offerSentRef.current = true;

      } catch (err) {

        console.error(

          "SKILLMEET OFFER ERROR:",

          err

        );



        offerSentRef.current = false;

        setError(

          err?.message ||

            "The SkillMeet connection could not be started."

        );

      } finally {

        offerInFlightRef.current = false;

      }

    },

    [createPeerConnection, sendSignal]

  );



  /* =========================================================

     START MEDIA + REALTIME ROOM

  ========================================================= */



  useEffect(() => {

    if (

      !user?.id ||

      !meeting?.id ||

      loading

    ) {

      return undefined;

    }



    let disposed = false;

    let roomChannel = null;



    const resetRemoteMedia = () => {

      remoteStreamRef.current

        ?.getTracks()

        .forEach((track) => track.stop());



      remoteStreamRef.current =

        new MediaStream();



      if (remoteVideoRef.current) {

        remoteVideoRef.current.srcObject =

          remoteStreamRef.current;

      }

    };



    const handleOffer = async ({ payload }) => {

      if (

        disposed ||

        !payload?.sdp ||

        payload?.sender === userRef.current?.id

      ) {

        return;

      }



      try {

        const peer = createPeerConnection();



        if (peer.signalingState !== "stable") {

          console.warn(

            "SKILLMEET OFFER WHILE SIGNALING:",

            peer.signalingState

          );

        }



        await peer.setRemoteDescription(

          new RTCSessionDescription(payload.sdp)

        );



        await flushPendingIceCandidates(peer);



        const answer = await peer.createAnswer();

        await peer.setLocalDescription(answer);



        if (!peer.localDescription) {

          throw new Error(

            "Local WebRTC answer was not created."

          );

        }



        await sendSignal("answer", {

          sdp: {

            type: peer.localDescription.type,

            sdp: peer.localDescription.sdp,

          },

        });



        setConnectionStatus("Connecting");

      } catch (err) {

        console.error(

          "SKILLMEET ANSWER ERROR:",

          err

        );



        setError(

          err?.message ||

            "Could not answer the SkillMeet call."

        );

      }

    };



    const handleAnswer = async ({ payload }) => {

      if (

        disposed ||

        !payload?.sdp ||

        payload?.sender === userRef.current?.id

      ) {

        return;

      }



      const peer = peerConnectionRef.current;



      if (!peer) {

        return;

      }



      try {

        if (

          peer.signalingState !==

          "have-local-offer"

        ) {

          console.warn(

            "SKILLMEET ANSWER IN STATE:",

            peer.signalingState

          );

          return;

        }



        await peer.setRemoteDescription(

          new RTCSessionDescription(payload.sdp)

        );



        await flushPendingIceCandidates(peer);



        setConnectionStatus("Connecting");

      } catch (err) {

        console.error(

          "SKILLMEET REMOTE ANSWER ERROR:",

          err

        );



        setError(

          err?.message ||

            "The remote SkillMeet answer could not be applied."

        );

      }

    };



    const handleIceCandidate = async ({ payload }) => {

      if (

        disposed ||

        !payload?.candidate ||

        payload?.sender === userRef.current?.id

      ) {

        return;

      }



      try {

        const candidate = new RTCIceCandidate(

          payload.candidate

        );



        const peer = peerConnectionRef.current;



        if (!peer?.remoteDescription?.type) {

          pendingIceCandidatesRef.current.push(candidate);

          return;

        }



        await peer.addIceCandidate(candidate);

      } catch (err) {

        console.warn(

          "SKILLMEET REMOTE ICE CANDIDATE ERROR:",

          err

        );

      }

    };



    const handleLeave = ({ payload }) => {

      if (

        payload?.sender === userRef.current?.id

      ) {

        return;

      }



      setParticipantCount(1);

      setConnectionStatus(

        `${getProfileName(

          counterpartRef.current

        )} left the meeting`

      );



      clearReconnectTimer();



      try {

        peerConnectionRef.current?.close();

      } catch {

        // Ignore cleanup errors.

      }



      peerConnectionRef.current = null;

      offerSentRef.current = false;

      offerInFlightRef.current = false;

      pendingIceCandidatesRef.current = [];



      resetRemoteMedia();

    };



    const handlePresenceSync = () => {

      if (!roomChannel || disposed) {

        return;

      }



      const state = roomChannel.presenceState();



      /*

        Presence is keyed by user ID. Count unique users rather

        than presence metas so one user opening two tabs does not

        look like two different meeting participants.

      */

      const count = Object.keys(state).length;



      setParticipantCount(

        Math.max(count, 1)

      );



      if (count > 1) {

        if (

          peerConnectionRef.current

            ?.connectionState === "connected"

        ) {

          setConnectionStatus("Connected");

          return;

        }



        setConnectionStatus(

          "Participant joined"

        );



        if (

          isInitiatorRef.current &&

          !offerSentRef.current &&

          !offerInFlightRef.current

        ) {

          window.setTimeout(() => {

            if (!disposed) {

              createOffer();

            }

          }, 350);

        }

      } else {

        setConnectionStatus(

          "Waiting for participant"

        );

      }

    };



    const handleRestartIce = () => {

      if (

        !disposed &&

        isInitiatorRef.current

      ) {

        createOffer({ iceRestart: true });

      }

    };



    window.addEventListener(

      "skillmeet-restart-ice",

      handleRestartIce

    );



    const start = async () => {

      try {

        setJoining(true);

        setError("");

        setConnectionStatus(

          "Requesting camera and microphone"

        );



        if (

          !navigator.mediaDevices?.getUserMedia

        ) {

          throw new Error(

            "This browser does not support camera and microphone access."

          );

        }



        const localStream =

          await navigator.mediaDevices.getUserMedia({

            video: {

              width: { ideal: 1280 },

              height: { ideal: 720 },

            },

            audio: {

              echoCancellation: true,

              noiseSuppression: true,

              autoGainControl: true,

            },

          });



        if (disposed) {

          localStream

            .getTracks()

            .forEach((track) => track.stop());

          return;

        }



        localStreamRef.current = localStream;

        remoteStreamRef.current =

          new MediaStream();



        if (localVideoRef.current) {

          localVideoRef.current.srcObject =

            localStream;



          localVideoRef.current

            .play()

            .catch(() => {});

        }



        const roomName =

          `skillmeet:${sessionType}:${sessionId}`;



        roomChannel = supabase.channel(

          roomName,

          {

            config: {

              broadcast: {

                self: false,

                ack: true,

              },

              presence: {

                key: userRef.current.id,

              },

            },

          }

        );



        channelRef.current = roomChannel;



        roomChannel

          .on(

            "broadcast",

            { event: "offer" },

            handleOffer

          )

          .on(

            "broadcast",

            { event: "answer" },

            handleAnswer

          )

          .on(

            "broadcast",

            { event: "ice-candidate" },

            handleIceCandidate

          )

          .on(

            "broadcast",

            { event: "leave" },

            handleLeave

          )

          .on(

            "presence",

            { event: "sync" },

            handlePresenceSync

          );



        roomChannel.subscribe(async (status) => {

          if (disposed) {

            return;

          }



          console.log(

            "SKILLMEET REALTIME STATUS:",

            status

          );



          if (status === "SUBSCRIBED") {

            await roomChannel.track({

              user_id: userRef.current.id,

              joined_at: new Date().toISOString(),

            });



            setConnectionStatus(

              "Waiting for participant"

            );

            setJoining(false);



            const tableName =

              sessionType === "swap"

                ? "swap_sessions"

                : "sessions";



            const { error: timestampError } =

              await supabase

                .from(tableName)

                .update({

                  meeting_started_at:

                    new Date().toISOString(),

                })

                .eq("id", sessionId)

                .is("meeting_started_at", null);



            if (timestampError) {

              console.warn(

                "SKILLMEET START TIMESTAMP:",

                timestampError

              );

            }

          }



          if (

            status === "CHANNEL_ERROR" ||

            status === "TIMED_OUT"

          ) {

            setJoining(false);

            setConnectionStatus(

              "Realtime connection problem"

            );

            setError(

              "Could not connect to SkillMeet signaling. Check your internet connection and the Supabase Realtime configuration, then rejoin."

            );

          }

        });

      } catch (err) {

        console.error(

          "SKILLMEET START ERROR:",

          err

        );



        setJoining(false);



        setError(

          err?.name === "NotAllowedError"

            ? "Camera or microphone permission was denied. Allow access and reopen SkillMeet."

            : err?.message ||

                "Could not start camera and microphone."

        );

      }

    };



    start();



    return () => {

      disposed = true;

      clearReconnectTimer();



      window.removeEventListener(

        "skillmeet-restart-ice",

        handleRestartIce

      );



      try {

        peerConnectionRef.current?.close();

      } catch {

        // Ignore cleanup errors.

      }



      peerConnectionRef.current = null;

      offerSentRef.current = false;

      offerInFlightRef.current = false;

      pendingIceCandidatesRef.current = [];



      localStreamRef.current

        ?.getTracks()

        .forEach((track) => track.stop());



      remoteStreamRef.current

        ?.getTracks()

        .forEach((track) => track.stop());



      localStreamRef.current = null;

      remoteStreamRef.current = null;



      if (roomChannel) {

        roomChannel.untrack().catch(() => {});

        supabase.removeChannel(roomChannel);

      }



      channelRef.current = null;

    };

  }, [

    clearReconnectTimer,

    createOffer,

    createPeerConnection,

    flushPendingIceCandidates,

    loading,

    meeting?.id,

    sendSignal,

    sessionId,

    sessionType,

    user?.id,

  ]);



  /* =========================================================

     CONTROLS

  ========================================================= */



  const toggleMicrophone = () => {

    const audioTracks =

      localStreamRef.current

        ?.getAudioTracks() || [];



    const next = !micEnabled;



    audioTracks.forEach((track) => {

      track.enabled = next;

    });



    setMicEnabled(next);

  };



  const toggleCamera = () => {

    const videoTracks =

      localStreamRef.current

        ?.getVideoTracks() || [];



    const next = !cameraEnabled;



    videoTracks.forEach((track) => {

      if (track !== screenTrackRef.current) {

        track.enabled = next;

      }

    });



    setCameraEnabled(next);

  };



  const stopScreenShare = useCallback(

    async () => {

      const peer = peerConnectionRef.current;

      const stream = localStreamRef.current;



      const cameraTrack = stream

        ?.getVideoTracks()

        .find(

          (track) =>

            track !== screenTrackRef.current

        );



      if (peer && cameraTrack) {

        const sender = peer

          .getSenders()

          .find(

            (item) =>

              item.track?.kind === "video"

          );



        if (sender) {

          await sender.replaceTrack(cameraTrack);

        }

      }



      if (screenTrackRef.current) {

        screenTrackRef.current.onended = null;

        screenTrackRef.current.stop();

        screenTrackRef.current = null;

      }



      if (localVideoRef.current && stream) {

        localVideoRef.current.srcObject = stream;

      }



      setSharingScreen(false);

    },

    []

  );



  const toggleScreenShare = async () => {

    if (sharingScreen) {

      await stopScreenShare();

      return;

    }



    try {

      if (!navigator.mediaDevices?.getDisplayMedia) {

        throw new Error(

          "Screen sharing is not supported in this browser."

        );

      }



      const screenStream =

        await navigator.mediaDevices.getDisplayMedia({

          video: true,

          audio: false,

        });



      const [screenTrack] =

        screenStream.getVideoTracks();



      if (!screenTrack) {

        return;

      }



      const peer = createPeerConnection();



      const sender = peer

        .getSenders()

        .find(

          (item) =>

            item.track?.kind === "video"

        );



      if (sender) {

        await sender.replaceTrack(screenTrack);

      }



      screenTrackRef.current = screenTrack;



      screenTrack.onended = () => {

        stopScreenShare();

      };



      if (localVideoRef.current) {

        localVideoRef.current.srcObject =

          screenStream;

      }



      setSharingScreen(true);

    } catch (err) {

      if (err?.name !== "NotAllowedError") {

        setError(

          err?.message ||

            "Screen sharing could not start."

        );

      }

    }

  };



  const leaveMeeting = async () => {

    if (leavingRef.current) {

      return;

    }



    leavingRef.current = true;



    try {

      await sendSignal("leave");

    } catch {

      // Leave even if signaling is already unavailable.

    }



    clearReconnectTimer();



    try {

      peerConnectionRef.current?.close();

    } catch {

      // Ignore close errors.

    }



    localStreamRef.current

      ?.getTracks()

      .forEach((track) => track.stop());



    remoteStreamRef.current

      ?.getTracks()

      .forEach((track) => track.stop());



    if (channelRef.current) {

      try {

        await channelRef.current.untrack();

      } catch {

        // Ignore presence cleanup errors.

      }



      await supabase.removeChannel(

        channelRef.current

      );

    }



    navigate("/sessions");

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



  if (error && !meeting) {

    return (

      <main className="grid min-h-screen place-items-center bg-[#060807] px-5 text-[#f2f4ef]">

        <div className="w-full max-w-lg border border-[#ff6b6b]/30 bg-[#0a0d0b] p-7 text-center">

          <p className="text-sm leading-7 text-[#ff8b8b]">

            {error}

          </p>



          <button

            type="button"

            onClick={() => navigate("/sessions")}

            className="mt-5 inline-flex min-h-10 items-center gap-2 border border-white/10 px-4 text-xs text-[#a1a1aa] hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"

          >

            <ArrowLeft size={14} />

            Back to sessions

          </button>

        </div>

      </main>

    );

  }



  /* =========================================================

     PAGE

  ========================================================= */

  const formattedSchedule = meeting?.scheduled_at
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(meeting.scheduled_at))
    : "Live session";

  const connected = connectionStatus === "Connected";
  const isLightTheme = resolvedTheme === "light";

  const pageBg = isLightTheme ? "bg-[#f3f6f3] text-[#111827]" : "bg-[#050706] text-[#f4f7f1]";
  const panelBorder = isLightTheme ? "border-[#dfe9e2]" : "border-white/[0.08]";
  const panelBg = isLightTheme ? "bg-white/80" : "bg-[#0a0d0b]/80";
  const softPanelBg = isLightTheme ? "bg-[#f5f8f6]" : "bg-[#0a0d0b]/70";
  const stageBg = isLightTheme ? "bg-[#eef3ef]" : "bg-[#020403]";
  const stageFill = isLightTheme ? "bg-[#f7faf7]" : "bg-[#050706]";
  const subtleText = isLightTheme ? "text-[#475569]" : "text-[#8d938b]";
  const mutedText = isLightTheme ? "text-[#52606d]" : "text-white/35";
  const headerBg = isLightTheme ? "border-[#dfe9e2] bg-[#f8faf8]/90" : "border-white/[0.07] bg-[#050706]/80";
  const controlBg = isLightTheme ? "border-[#dfe9e2] bg-white/80 text-[#1f2937]" : "border-white/10 bg-white/[0.025] text-[#a4aaa2]";
  const divider = isLightTheme ? "divide-[#e4ece6]" : "divide-white/[0.07]";
  const localPreviewBg = isLightTheme ? "bg-[#edf3ee]" : "bg-[#111511]";
  const localPreviewBadgeBg = isLightTheme ? "bg-white text-[#475569]" : "bg-white/[0.03] text-white/35";
  const localPreviewBadgeBorder = isLightTheme ? "border-[#dfe9e2]" : "border-white/10";

  return (
    <main className={`relative min-h-screen overflow-hidden ${pageBg}`}>
      {/* ambient background */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: isLightTheme
            ? "radial-gradient(circle at 15% 10%, rgba(76,124,45,.08), transparent 30%), radial-gradient(circle at 85% 15%, rgba(72,104,255,.08), transparent 26%), radial-gradient(circle at 50% 100%, rgba(120,165,30,.06), transparent 30%)"
            : "radial-gradient(circle at 15% 10%, rgba(199,255,57,.08), transparent 30%), radial-gradient(circle at 85% 15%, rgba(73,111,255,.08), transparent 26%), radial-gradient(circle at 50% 100%, rgba(199,255,57,.04), transparent 30%)",
        }}
      />
      <div className="noise pointer-events-none fixed inset-0 opacity-50" />

      {/* top bar */}
      <header className={`relative z-40 border-b backdrop-blur-2xl ${headerBg}`}>
        <div className="mx-auto flex min-h-[76px] max-w-[1700px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={leaveMeeting}
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition ${isLightTheme ? "border-[#dfe9e2] bg-white/80 text-[#52606d] hover:border-[#c7ff39]/35 hover:bg-[#c7ff39]/[0.10] hover:text-[#3d6d00]" : "border-white/10 bg-white/[0.025] text-[#a4aaa2] hover:border-[#c7ff39]/30 hover:bg-[#c7ff39]/[0.05] hover:text-[#c7ff39]"}`}
              title="Back to sessions"
            >
              <ArrowLeft size={16} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c7ff39]/20 bg-[#c7ff39]/[0.055] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-[#c7ff39]">
                  <Sparkles size={10} />
                  SkillMeet
                </span>

                <span className={`hidden text-[10px] sm:inline ${mutedText}`}>
                  {sessionType === "swap" ? "Skill Swap" : "Mentorship"}
                </span>
              </div>

              <h1 className="mt-1 max-w-[48vw] truncate text-sm font-medium tracking-[-0.025em] sm:text-base md:max-w-[620px]">
                {meeting?.title ||
                  (sessionType === "swap"
                    ? "Skill Swap Meeting"
                    : "Mentorship Session")}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`hidden items-center gap-2 rounded-full border px-3 py-2 text-[11px] sm:inline-flex ${
                connected
                  ? "border-[#c7ff39]/20 bg-[#c7ff39]/[0.04] text-[#c7ff39]"
                  : isLightTheme
                    ? "border-[#f1d6a1] bg-[#fff6df] text-[#7a5700]"
                    : "border-white/10 bg-white/[0.025] text-[#a4aaa2]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  connected
                    ? "bg-[#c7ff39] shadow-[0_0_12px_rgba(199,255,57,.8)]"
                    : "bg-[#f6c453]"
                }`}
              />
              {connectionStatus}
            </div>

            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${controlBg}`}>
              <Users size={13} />
              <span>{participantCount}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1700px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        {error && (
          <div className="mb-4 flex items-start justify-between gap-4 rounded-2xl border border-[#ff6b6b]/25 bg-[#ff6b6b]/[0.055] px-4 py-3 text-sm leading-6 text-[#ff9a9a] backdrop-blur-xl">
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* meeting stage */}
          <section className={`relative min-w-0 overflow-hidden rounded-[28px] border shadow-[0_24px_80px_rgba(0,0,0,.18)] ${panelBorder} ${stageBg}`}>
            <div className="relative aspect-video min-h-[420px] w-full sm:min-h-[500px] xl:min-h-[650px]">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />

              {/* remote waiting state */}
              {participantCount < 2 && (
                <div className={`absolute inset-0 grid place-items-center overflow-hidden ${stageFill}`}>
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: isLightTheme
                        ? "radial-gradient(circle at 50% 42%, rgba(121,158,50,.10), transparent 25%)"
                        : "radial-gradient(circle at 50% 42%, rgba(199,255,57,.08), transparent 25%)",
                    }}
                  />

                  <div className="relative px-6 text-center">
                    <div className="relative mx-auto h-24 w-24">
                      <div className="absolute inset-0 rounded-full border border-[#c7ff39]/15 animate-ping" />
                      <div className="relative grid h-24 w-24 place-items-center rounded-full border border-[#c7ff39]/25 bg-[#c7ff39]/[0.055] text-3xl font-semibold text-[#c7ff39] shadow-[0_0_50px_rgba(199,255,57,.08)]">
                        {counterpart?.avatar_url ? (
                          <img
                            src={counterpart.avatar_url}
                            alt={getProfileName(counterpart)}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          getProfileName(counterpart)
                            .slice(0, 1)
                            .toUpperCase()
                        )}
                      </div>
                    </div>

                    <h2 className={`mt-6 text-xl font-medium tracking-[-0.03em] sm:text-2xl ${isLightTheme ? "text-[#111827]" : "text-white"}`}>
                      Waiting for {getProfileName(counterpart)}
                    </h2>

                    <p className={`mx-auto mt-2 max-w-md text-sm leading-6 ${subtleText}`}>
                      You are in the room. SkillMeet will connect automatically
                      when the other participant joins.
                    </p>

                    <div className={`mt-5 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.13em] ${isLightTheme ? "border-[#dfe9e2] bg-white/80 text-[#475569]" : "border-white/10 bg-white/[0.025] text-white/45"}`}>
                      <Radio size={12} className="text-[#c7ff39]" />
                      Room is live
                    </div>
                  </div>
                </div>
              )}

              {/* top stage pills */}
              <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap items-center gap-2">
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] backdrop-blur-xl ${isLightTheme ? "border-[#dfe9e2] bg-white/80 text-[#1f2937]" : "border-white/10 bg-black/45 text-white/75"}`}>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      connected ? "bg-[#c7ff39]" : "bg-[#f6c453]"
                    }`}
                  />
                  {connectionStatus}
                </div>

                {sharingScreen && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#c7ff39]/25 bg-[#071008]/75 px-3 py-2 text-[10px] text-[#c7ff39] backdrop-blur-xl">
                    <MonitorUp size={12} />
                    Screen sharing
                  </div>
                )}
              </div>

              {/* local preview */}
              <div className={`absolute bottom-5 right-5 w-[27%] min-w-[150px] max-w-[310px] overflow-hidden rounded-2xl border shadow-[0_18px_60px_rgba(0,0,0,.18)] ${isLightTheme ? "border-[#dfe9e2] bg-white/80" : "border-white/15 bg-black"}`}>
                <div className={`relative aspect-video ${localPreviewBg}`}>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />

                  {!cameraEnabled && !sharingScreen && (
                    <div className={`absolute inset-0 grid place-items-center ${isLightTheme ? "bg-[#edf2ee]" : "bg-[#0b0e0c]"}`}>
                      <div className={`grid h-12 w-12 place-items-center rounded-full border ${localPreviewBadgeBorder} ${localPreviewBadgeBg}`}>
                        <VideoOff size={18} />
                      </div>
                    </div>
                  )}

                  <div className={`absolute inset-x-0 bottom-0 flex items-center justify-between px-3 pb-2.5 pt-7 ${isLightTheme ? "bg-gradient-to-t from-[#dfeae1]/90 to-transparent" : "bg-gradient-to-t from-black/80 to-transparent"}`}>
                    <span className={`text-[10px] font-medium ${isLightTheme ? "text-[#111827]" : "text-white/90"}`}>
                      You
                    </span>

                    <div className={`flex items-center gap-1.5 ${isLightTheme ? "text-[#4b5563]" : "text-white/65"}`}>
                      {!micEnabled && <MicOff size={11} />}
                      {!cameraEnabled && <VideoOff size={11} />}
                    </div>
                  </div>
                </div>
              </div>

              {/* joining overlay */}
              {joining && (
                <div className={`absolute inset-0 grid place-items-center backdrop-blur-md ${isLightTheme ? "bg-[#f3f6f3]/88" : "bg-[#050706]/88"}`}>
                  <div className="text-center">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#c7ff39]/20 bg-[#c7ff39]/[0.05]">
                      <Loader2
                        size={24}
                        className="animate-spin text-[#c7ff39]"
                      />
                    </div>

                    <p className={`mt-4 text-xs uppercase tracking-[0.16em] ${subtleText}`}>
                      Joining SkillMeet
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* control dock */}
            <div className={`border-t px-3 py-4 backdrop-blur-2xl sm:px-5 ${isLightTheme ? "border-[#dfe9e2] bg-[#f7faf7]/95" : "border-white/[0.08] bg-[#080b09]/95"}`}>
              <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={toggleMicrophone}
                  className={`group inline-flex min-h-12 items-center gap-2 rounded-2xl border px-4 text-xs font-medium transition ${
                    micEnabled
                      ? isLightTheme
                        ? "border-[#dfe9e2] bg-white/80 text-[#1f2937] hover:border-[#c7ff39]/30 hover:bg-[#c7ff39]/[0.10]"
                        : "border-white/10 bg-white/[0.04] text-white hover:border-[#c7ff39]/25 hover:bg-[#c7ff39]/[0.04]"
                      : "border-[#ff6b6b]/25 bg-[#ff6b6b]/[0.07] text-[#ff8f8f]"
                  }`}
                  title={micEnabled ? "Mute microphone" : "Unmute microphone"}
                >
                  {micEnabled ? <Mic size={17} /> : <MicOff size={17} />}
                  <span className="hidden sm:inline">
                    {micEnabled ? "Mute" : "Unmute"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`group inline-flex min-h-12 items-center gap-2 rounded-2xl border px-4 text-xs font-medium transition ${
                    cameraEnabled
                      ? isLightTheme
                        ? "border-[#dfe9e2] bg-white/80 text-[#1f2937] hover:border-[#c7ff39]/30 hover:bg-[#c7ff39]/[0.10]"
                        : "border-white/10 bg-white/[0.04] text-white hover:border-[#c7ff39]/25 hover:bg-[#c7ff39]/[0.04]"
                      : "border-[#ff6b6b]/25 bg-[#ff6b6b]/[0.07] text-[#ff8f8f]"
                  }`}
                  title={cameraEnabled ? "Turn camera off" : "Turn camera on"}
                >
                  {cameraEnabled ? (
                    <Video size={17} />
                  ) : (
                    <VideoOff size={17} />
                  )}
                  <span className="hidden sm:inline">
                    {cameraEnabled ? "Camera" : "Camera off"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={toggleScreenShare}
                  className={`inline-flex min-h-12 items-center gap-2 rounded-2xl border px-4 text-xs font-medium transition ${
                    sharingScreen
                      ? "border-[#c7ff39]/30 bg-[#c7ff39]/[0.08] text-[#c7ff39]"
                      : isLightTheme
                        ? "border-[#dfe9e2] bg-white/80 text-[#1f2937] hover:border-[#c7ff39]/30 hover:bg-[#c7ff39]/[0.10]"
                        : "border-white/10 bg-white/[0.04] text-white hover:border-[#c7ff39]/25 hover:bg-[#c7ff39]/[0.04]"
                  }`}
                >
                  <MonitorUp size={17} />
                  <span className="hidden sm:inline">
                    {sharingScreen ? "Stop sharing" : "Share screen"}
                  </span>
                </button>

                <div className={`mx-1 hidden h-7 w-px sm:block ${isLightTheme ? "bg-[#dfe9e2]" : "bg-white/10"}`} />

                <button
                  type="button"
                  onClick={leaveMeeting}
                  className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#ff5f57] px-5 text-xs font-semibold text-white shadow-[0_8px_30px_rgba(255,95,87,.18)] transition hover:-translate-y-0.5 hover:bg-[#ff6b64]"
                >
                  <PhoneOff size={17} />
                  Leave
                </button>
              </div>
            </div>
          </section>

          {/* session sidebar */}
          <aside className="grid content-start gap-4 xl:sticky xl:top-4 xl:self-start">
            <section className={`overflow-hidden rounded-[24px] border backdrop-blur-xl ${panelBorder} ${panelBg}`}>
              <div className={`border-b p-5 ${isLightTheme ? "border-[#e5ece7]" : "border-white/[0.08]"}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.16em] text-[#c7ff39]">
                      Session
                    </p>
                    <h2 className={`mt-2 text-lg font-medium tracking-[-0.03em] ${isLightTheme ? "text-[#111827]" : "text-white"}`}>
                      Meeting details
                    </h2>
                  </div>

                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#c7ff39]/15 bg-[#c7ff39]/[0.04] text-[#c7ff39]">
                    <ShieldCheck size={17} />
                  </div>
                </div>
              </div>

              <div className={`divide-y ${divider}`}>
                <div className="p-5">
                  <p className={`text-[9px] uppercase tracking-[0.14em] ${mutedText}`}>
                    Participant
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    {counterpart?.avatar_url ? (
                      <img
                        src={counterpart.avatar_url}
                        alt={getProfileName(counterpart)}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-medium text-[#c7ff39] ${isLightTheme ? "border-[#dfe9e2] bg-[#f3f7f4]" : "border-white/10 bg-white/[0.03]"}`}>
                        {getProfileName(counterpart)
                          .slice(0, 1)
                          .toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className={`truncate text-sm font-medium ${isLightTheme ? "text-[#111827]" : "text-white"}`}>
                        {getProfileName(counterpart)}
                      </p>
                      <p className={`mt-0.5 text-[10px] ${mutedText}`}>
                        {participantCount > 1 ? "In the room" : "Not joined yet"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <p className={`text-[9px] uppercase tracking-[0.14em] ${mutedText}`}>
                    Scheduled
                  </p>
                  <p className={`mt-2 text-sm ${isLightTheme ? "text-[#334155]" : "text-[#d7dbd4]"}`}>
                    {formattedSchedule}
                  </p>
                </div>

                <div className="grid grid-cols-2">
                  <div className="p-5">
                    <p className={`text-[9px] uppercase tracking-[0.14em] ${mutedText}`}>
                      Type
                    </p>
                    <p className={`mt-2 text-sm ${isLightTheme ? "text-[#1f2937]" : "text-white"}`}>
                      {sessionType === "swap" ? "Skill Swap" : "Mentorship"}
                    </p>
                  </div>

                  <div className={`border-l p-5 ${isLightTheme ? "border-[#e5ece7]" : "border-white/[0.07]"}`}>
                    <p className={`text-[9px] uppercase tracking-[0.14em] ${mutedText}`}>
                      Duration
                    </p>
                    <p className={`mt-2 text-sm ${isLightTheme ? "text-[#1f2937]" : "text-white"}`}>
                      {meeting?.duration_minutes
                        ? `${meeting.duration_minutes} min`
                        : "Flexible"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className={`rounded-[24px] border p-5 backdrop-blur-xl ${panelBorder} ${softPanelBg}`}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#c7ff39]" />
                <p className={`text-[9px] uppercase tracking-[0.14em] ${mutedText}`}>
                  Secure connection
                </p>
              </div>

              <p className={`mt-3 text-xs leading-6 ${subtleText}`}>
                SkillMeet uses WebRTC for direct media and TURN fallback when
                required by the network.
              </p>

              <div className={`mt-4 flex items-center gap-2 text-[10px] ${mutedText}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#c7ff39]" />
                Room {sessionId?.slice(0, 8)}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
