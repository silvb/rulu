import { useState, useCallback, useEffect } from "react";
import type { Member } from "../lib/types";
import { supabase, HOUSEHOLD_ID } from "../lib/supabase";

const MEMBER_KEY = "rulu-member-id";

export function useMember() {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("members")
        .select("*")
        .eq("household_id", HOUSEHOLD_ID);

      if (cancelled) return;

      const membersList = (data ?? []) as Member[];
      setMembers(membersList);

      // Auto-login from localStorage
      const savedId = localStorage.getItem(MEMBER_KEY);
      if (savedId) {
        const found = membersList.find((m) => m.id === savedId);
        if (found) setCurrentMember(found);
      }

      setLoaded(true);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    (memberId: string) => {
      const member = members.find((m) => m.id === memberId);
      if (member) {
        setCurrentMember(member);
        localStorage.setItem(MEMBER_KEY, memberId);
      }
    },
    [members],
  );

  const logout = useCallback(() => {
    setCurrentMember(null);
    localStorage.removeItem(MEMBER_KEY);
  }, []);

  return { members, currentMember, loaded, login, logout };
}
