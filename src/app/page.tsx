import InquiryApp from "./InquiryApp";
import { getInitialDataFromApi } from "./priceMaster";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialData = await getInitialDataFromApi();

  return <InquiryApp initialData={initialData} />;
}
