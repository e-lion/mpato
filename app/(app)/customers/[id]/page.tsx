import { notFound } from "next/navigation";
import { CustomerProfile } from "@/components/app/CustomerProfile";
import { getCurrentStoreId, getCustomerProfile } from "@/lib/data/queries";

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const storeId = await getCurrentStoreId();
  if (!storeId) notFound();

  const profile = await getCustomerProfile(storeId, id);
  if (!profile) notFound();

  return <CustomerProfile profile={profile} />;
}
