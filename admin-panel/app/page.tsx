"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, getRole } from "@/lib/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const role = getRole();
    if (token && role === "admin") {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return <div className="center-screen">در حال هدایت...</div>;
}
