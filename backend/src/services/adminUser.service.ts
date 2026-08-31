import { User } from '../models/User';
import type { AdminUserListPayload, AdminUserItem, UserStats } from '../types/quiz';
import type { ListUsersQuery } from '../schemas/admin.schema';
import type { UserRole } from '../types/auth';

/**
 * Admin user service: list/filter/sort/search users with pagination
 * and aggregate statistics in a single payload. Password hashes are
 * never selected (the User model has password: select:false).
 */

/** Convert a lean user doc into a safe admin user item (no password). */
interface LeanUser {
  _id: { toString(): string };
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

function toAdminUserItem(u: LeanUser): AdminUserItem {
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
    updatedAt: u.updatedAt instanceof Date ? u.updatedAt.toISOString() : String(u.updatedAt),
  };
}

/** Build the MongoDB filter from query params. */
function buildFilter(query: ListUsersQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;
  if (query.search) {
    // Use a case-insensitive regex on name OR email for broad compatibility
    // (text index requires $text; regex works without index setup).
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
    ];
  }
  return filter;
}

/** Compute aggregate user statistics. */
async function computeStats(): Promise<UserStats> {
  const [total, byRoleAgg, byStatusAgg] = await Promise.all([
    User.estimatedDocumentCount().exec(),
    User.aggregate<{ _id: UserRole; count: number }>([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]).exec(),
    User.aggregate<{ _id: 'active' | 'suspended'; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).exec(),
  ]);

  const byRole: Record<UserRole, number> = {
    admin: 0,
    instructor: 0,
    candidate: 0,
  };
  for (const r of byRoleAgg) {
    byRole[r._id] = r.count;
  }

  const byStatus = { active: 0, suspended: 0 };
  for (const s of byStatusAgg) {
    byStatus[s._id] = s.count;
  }

  return { total, byRole, byStatus };
}

/** List users with pagination, filtering, sorting, search, and stats. */
export async function listUsers(query: ListUsersQuery): Promise<AdminUserListPayload> {
  const filter = buildFilter(query);
  const sortDir = query.sortOrder === 'asc' ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [query.sortBy]: sortDir };

  const skip = (query.page - 1) * query.limit;

  const [docs, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(query.limit)
      .lean<LeanUser[]>()
      .exec(),
    User.countDocuments(filter).exec(),
  ]);

  const stats = await computeStats();

  return {
    items: docs.map(toAdminUserItem),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
    stats,
  };
}
