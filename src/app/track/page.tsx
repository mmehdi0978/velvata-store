import { redirect } from "next/navigation";

// Public order tracking has moved inside the customer account.
// All customers now track their orders from /account after signing in.
export default function TrackPage() {
  redirect("/account");
}
