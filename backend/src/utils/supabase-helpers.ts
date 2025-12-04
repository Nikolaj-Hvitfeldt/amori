import { SupabaseClient } from "@supabase/supabase-js";
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from "../common/exceptions";
import { PAGINATION_DEFAULTS } from "../constants/app.constants";

/**
 * Pagination query result
 */
export interface PaginationResult<T> {
  data: T[];
  total: number;
}

/**
 * Options for findAllWithPagination
 */
export interface FindAllOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
}

/**
 * Find all records with pagination support
 * @param client - Supabase client
 * @param tableName - Name of the table
 * @param options - Pagination and ordering options
 * @returns Paginated result with data and total count
 */
export async function findAllWithPagination<T>(
  client: SupabaseClient,
  tableName: string,
  options: FindAllOptions = {}
): Promise<PaginationResult<T>> {
  const { limit, offset, orderBy, ascending = false } = options;

  // Get total count
  const { count, error: countError } = await client
    .from(tableName)
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new InternalServerErrorException(
      `Failed to count ${tableName}: ${countError.message}`
    );
  }

  // Build query
  let query = client.from(tableName).select("*");

  // Apply ordering if specified
  if (orderBy) {
    query = query.order(orderBy, { ascending });
  }

  // Apply pagination if provided
  if (limit !== undefined) {
    query = query.limit(limit);
  }
  if (offset !== undefined) {
    query = query.range(
      offset,
      offset + (limit || PAGINATION_DEFAULTS.DEFAULT_LIMIT) - 1
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new InternalServerErrorException(
      `Failed to fetch ${tableName}: ${error.message}`
    );
  }

  return {
    data: (data || []) as T[],
    total: count || 0,
  };
}

/**
 * Handle Supabase errors and throw appropriate exceptions
 * @param error - Supabase error object
 * @param operation - Operation name (e.g., "create", "update", "delete")
 * @param resourceName - Human-readable resource name (e.g., "moment", "date entry")
 * @param notFoundMessage - Custom message for not found errors (optional)
 */
export function handleSupabaseError(
  error: any,
  operation: "create" | "update" | "delete" | "fetch",
  resourceName: string,
  notFoundMessage?: string
): never {
  if (!error) {
    throw new Error("handleSupabaseError called without error");
  }

  // Check for common Supabase error codes
  if (error.code === "PGRST116" || error.message?.includes("No rows")) {
    throw new NotFoundException(
      notFoundMessage || `${resourceName} not found`
    );
  }

  // Determine exception type based on operation
  const errorMessage = `Failed to ${operation} ${resourceName}: ${error.message}`;

  if (operation === "fetch") {
    throw new InternalServerErrorException(errorMessage);
  } else {
    throw new BadRequestException(errorMessage);
  }
}

/**
 * Find one record by ID
 * @param client - Supabase client
 * @param tableName - Name of the table
 * @param id - Record ID
 * @param resourceName - Human-readable resource name for error messages
 * @returns The found record
 */
export async function findOneById<T>(
  client: SupabaseClient,
  tableName: string,
  id: string,
  resourceName: string
): Promise<T> {
  const { data, error } = await client
    .from(tableName)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    handleSupabaseError(error, "fetch", resourceName);
  }

  if (!data) {
    throw new NotFoundException(`${resourceName} not found`);
  }

  return data as T;
}

