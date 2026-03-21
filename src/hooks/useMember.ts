import { useState, useCallback, useEffect } from "react";
import type { Member } from "../lib/types";
import { supabase } from "../lib/supabase";

const MEMBER_KEY = "rulu-member-id";

export function useMember() {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Get household_id from the authenticated user's membership
      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id")
        .limit(1)
        .single();

      if (cancelled || !membership) {
        setLoaded(true);
        return;
      }

      const hid = membership.household_id as string;
      setHouseholdId(hid);

      // Fetch members for this household
      const { data } = await supabase
        .from("members")
        .select("*")
        .eq("household_id", hid);

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

  return { members, currentMember, householdId, loaded, login, logout };
}
