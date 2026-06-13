import { Staff } from "@/components/app/Staff";
import { getCurrentStoreId, getStaff } from "@/lib/data/queries";

export default async function StaffPage() {
  const storeId = await getCurrentStoreId();
  const staff = storeId ? await getStaff(storeId) : [];
  return <Staff staff={staff} />;
}
