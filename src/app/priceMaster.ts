import type { InitialData } from "./types";

type InitialDataResponse = {
  success: boolean;
  message?: string;
  data?: Partial<InitialData>;
};

export async function getInitialDataFromApi(): Promise<InitialData> {
  const apiUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_API_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_APPS_SCRIPT_API_URL is not set");
  }

  const response = await fetch(`${apiUrl}?action=getInitialData`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch initial data");
  }

  const result = (await response.json()) as InitialDataResponse;

  if (!result.success) {
    throw new Error(result.message || "Failed to fetch initial data");
  }

  return {
    priceMaster: result.data?.priceMaster ?? [],
    switchEstimateMaster: result.data?.switchEstimateMaster ?? [],
    dysonRoombaEstimateMaster:
      result.data?.dysonRoombaEstimateMaster ?? [],
    repairItemMaster: result.data?.repairItemMaster ?? [],
    androidModelRepairSettings: result.data?.androidModelRepairSettings ?? [],
    staffList: result.data?.staffList ?? [],
    optionMaster: result.data?.optionMaster ?? [],
    users: result.data?.users ?? [],
  };
}
