import { handleApiError, okResponse } from "@/lib/api-response";
import { logoutAdmin } from "@/modules/auth/auth.service";

export async function POST() {
  try {
    await logoutAdmin();
    return okResponse({ loggedOut: true });
  } catch (error) {
    return handleApiError(error);
  }
}

