"use server";

import { getSiteOrigin } from "@/lib/site-url";
import { notifyBusiness } from "@/lib/notify-business";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function cancelBooking(bookingId: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: cancelled } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("client_id", user.id)
    .in("status", ["pending", "confirmed"])
    .select("id");

  if (cancelled && cancelled.length > 0) {
    const origin = await getSiteOrigin();
    after(() => notifyBusiness({ id: bookingId }, "cancelled", origin));
  }

  revalidatePath("/mis-turnos");
}
