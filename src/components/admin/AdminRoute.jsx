import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
} from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function AdminRoute({
  children,
}) {
  const [state, setState] =
    useState({
      loading: true,
      allowed: false,
    });

  useEffect(() => {
    let active = true;

    const check = async () => {
      try {
        const {
          data: {
            user,
          },
        } =
          await supabase.auth
            .getUser();

        if (!user) {
          if (active) {
            setState({
              loading: false,
              allowed: false,
            });
          }

          return;
        }

        const {
          data,
          error,
        } =
          await supabase.rpc(
            "get_my_admin_access"
          );

        if (error) {
          throw error;
        }

        if (active) {
          setState({
            loading: false,
            allowed:
              data?.is_admin ===
              true,
          });
        }
      } catch {
        if (active) {
          setState({
            loading: false,
            allowed: false,
          });
        }
      }
    };

    check();

    return () => {
      active = false;
    };
  }, []);

  if (state.loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#060807] text-[#f2f4ef]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#c7ff39]" />
      </main>
    );
  }

  if (!state.allowed) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}
