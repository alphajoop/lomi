import { handleSupabaseRpc } from "@lomi./shared";
import { rpc } from "./rpc.js";
import type { DbFunctions, TypedSupabaseClient } from "./types.js";

export async function fetchBookableServices(
  client: TypedSupabaseClient,
  args: DbFunctions["fetch_bookable_services"]["Args"],
): Promise<DbFunctions["fetch_bookable_services"]["Returns"]> {
  const data = await handleSupabaseRpc(
    rpc(client, "fetch_bookable_services", args),
    "fetch_bookable_services",
    null,
  );
  return data ?? [];
}

export async function createBookableService(
  client: TypedSupabaseClient,
  args: DbFunctions["create_bookable_service"]["Args"],
): Promise<DbFunctions["create_bookable_service"]["Returns"]> {
  const data = await handleSupabaseRpc(
    rpc(client, "create_bookable_service", args),
    "create_bookable_service",
  );
  if (!data) {
    throw new Error("create_bookable_service returned no service id");
  }
  return data;
}

export async function updateBookableService(
  client: TypedSupabaseClient,
  args: DbFunctions["update_bookable_service"]["Args"],
): Promise<void> {
  await handleSupabaseRpc(
    rpc(client, "update_bookable_service", args),
    "update_bookable_service",
    { expectReturnValue: false },
  );
}

export async function fetchServiceAvailabilityRules(
  client: TypedSupabaseClient,
  args: DbFunctions["fetch_service_availability_rules"]["Args"],
): Promise<DbFunctions["fetch_service_availability_rules"]["Returns"]> {
  const data = await handleSupabaseRpc(
    rpc(client, "fetch_service_availability_rules", args),
    "fetch_service_availability_rules",
    null,
  );
  return data ?? [];
}

export async function replaceServiceAvailabilityRules(
  client: TypedSupabaseClient,
  args: DbFunctions["replace_service_availability_rules"]["Args"],
): Promise<void> {
  await handleSupabaseRpc(
    rpc(client, "replace_service_availability_rules", args),
    "replace_service_availability_rules",
    { expectReturnValue: false },
  );
}

export async function fetchOrganizationBookings(
  client: TypedSupabaseClient,
  args: DbFunctions["fetch_organization_bookings"]["Args"],
): Promise<DbFunctions["fetch_organization_bookings"]["Returns"]> {
  const data = await handleSupabaseRpc(
    rpc(client, "fetch_organization_bookings", args),
    "fetch_organization_bookings",
    null,
  );
  return data ?? [];
}

export async function updateBookingStatus(
  client: TypedSupabaseClient,
  args: DbFunctions["update_booking_status"]["Args"],
): Promise<void> {
  await handleSupabaseRpc(
    rpc(client, "update_booking_status", args),
    "update_booking_status",
    { expectReturnValue: false },
  );
}
