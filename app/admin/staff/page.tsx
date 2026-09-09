import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TeamMemberAccessCard from "@/components/admin/TeamMemberAccessCard";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  department: string | null;
  responsibilities: string[] | null;
  is_active: boolean;
  created_at: string | null;
};

type ResponsibilityOption = {
  id: number;
  category: string;
  label: string;
  code: string;
  sort_order: number;
};

type PermissionRow = {
  code: string;
  name: string;
  permission_group: string;
  description: string | null;
  is_sensitive: boolean;
};

type StaffPermissionRow = {
  user_id: string;
  permission: string;
  is_allowed: boolean;
};

const ADMIN_STAFF_PERMISSIONS = [
  "staff.view",
  "staff.create",
  "staff.disable",
  "staff.manage_permissions",
];

async function saveTeamAccessAction(
  formData: FormData
) {
  "use server";

  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account");
  }

  const {
    data: actorProfile,
    error: actorProfileError,
  } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (
    actorProfileError ||
    !actorProfile ||
    !actorProfile.is_active
  ) {
    throw new Error("Access denied.");
  }

  const userId = String(
    formData.get("user_id") ?? ""
  );

  if (!userId) {
    throw new Error("User ID is missing.");
  }

  const requestedRole = String(
    formData.get("role") ?? ""
  );

  const department = String(
    formData.get("department") ?? ""
  );

  const isActive =
    formData.get("is_active") === "true";

  const responsibilities = formData
    .getAll("responsibilities")
    .map((value) => String(value));

  const permissions = formData
    .getAll("permissions")
    .map((value) => String(value));

  const requestedCanManageStaff =
    formData.get("can_manage_staff") ===
    "true";

  let finalRole = requestedRole;
  let finalCanManageStaff = false;

  /*
   * OWNER
   *
   * Owner may assign Admin, Staff or Customer.
   */
  if (actorProfile.role === "owner") {
    if (
      ![
        "admin",
        "staff",
        "customer",
      ].includes(finalRole)
    ) {
      throw new Error("Invalid role.");
    }

    finalCanManageStaff =
      finalRole === "admin" &&
      requestedCanManageStaff;
  }

  /*
   * ADMIN
   *
   * Authorized Admin can manage
   * existing Staff only.
   *
   * The role is forced to Staff here,
   * and the database RPC checks it again.
   */
  else if (actorProfile.role === "admin") {
    const permissionChecks =
      await Promise.all(
        ADMIN_STAFF_PERMISSIONS.map(
          (permission) =>
            supabase.rpc(
              "has_permission",
              {
                required_permission:
                  permission,
              }
            )
        )
      );

    const adminCanManageStaff =
      permissionChecks.every(
        (result) =>
          !result.error &&
          result.data === true
      );

    if (!adminCanManageStaff) {
      throw new Error(
        "Staff management permission denied."
      );
    }

    const {
      data: targetProfile,
      error: targetProfileError,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (
      targetProfileError ||
      !targetProfile ||
      targetProfile.role !== "staff"
    ) {
      throw new Error(
        "Admins can manage Staff accounts only."
      );
    }

    finalRole = "staff";
    finalCanManageStaff = false;
  } else {
    throw new Error("Access denied.");
  }

  const {
    error: manageError,
  } = await supabase.rpc(
    "manage_team_member_access",
    {
      p_user_id: userId,
      p_role: finalRole,
      p_department:
        finalRole === "customer"
          ? null
          : department || null,
      p_is_active: isActive,
      p_responsibilities:
        responsibilities,
      p_permissions: permissions,
      p_can_manage_staff:
        finalCanManageStaff,
    }
  );

  if (manageError) {
    throw new Error(
      manageError.message
    );
  }

  revalidatePath("/admin/staff");
  revalidatePath("/admin");
}

export default async function StaffManagementPage() {
  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account");
  }

  const {
    data: currentProfile,
    error: currentProfileError,
  } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (
    currentProfileError ||
    !currentProfile ||
    !currentProfile.is_active
  ) {
    redirect("/admin");
  }

  const isOwner =
    currentProfile.role === "owner";

  const isAdmin =
    currentProfile.role === "admin";

  /*
   * ADMIN STAFF-MANAGEMENT ACCESS
   */
  let adminCanManageStaff = false;

  if (isAdmin) {
    const permissionChecks =
      await Promise.all(
        ADMIN_STAFF_PERMISSIONS.map(
          (permission) =>
            supabase.rpc(
              "has_permission",
              {
                required_permission:
                  permission,
              }
            )
        )
      );

    adminCanManageStaff =
      permissionChecks.every(
        (result) =>
          !result.error &&
          result.data === true
      );
  }

  if (
    !isOwner &&
    !adminCanManageStaff
  ) {
    redirect("/admin");
  }

  /*
   * LOAD TEAM DATA
   */
  const [
    profilesResult,
    responsibilityResult,
    permissionResult,
    staffPermissionResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        role,
        department,
        responsibilities,
        is_active,
        created_at
      `)
      .order("created_at", {
        ascending: true,
      }),

    supabase
      .from(
        "staff_responsibility_options"
      )
      .select(`
        id,
        category,
        label,
        code,
        sort_order
      `)
      .eq("is_active", true)
      .order("sort_order", {
        ascending: true,
      }),

    supabase
      .from("permissions")
      .select(`
        code,
        name,
        permission_group,
        description,
        is_sensitive
      `)
      .order("permission_group", {
        ascending: true,
      })
      .order("name", {
        ascending: true,
      }),

    supabase
      .from("staff_permissions")
      .select(`
        user_id,
        permission,
        is_allowed
      `),
  ]);

  if (profilesResult.error) {
    throw new Error(
      profilesResult.error.message
    );
  }

  if (responsibilityResult.error) {
    throw new Error(
      responsibilityResult.error.message
    );
  }

  if (permissionResult.error) {
    throw new Error(
      permissionResult.error.message
    );
  }

  if (staffPermissionResult.error) {
    throw new Error(
      staffPermissionResult.error.message
    );
  }

  const profiles =
    (profilesResult.data ??
      []) as ProfileRow[];

  const responsibilityOptions =
    (responsibilityResult.data ??
      []) as ResponsibilityOption[];

  const allPermissions =
    (permissionResult.data ??
      []) as PermissionRow[];

  const staffPermissions =
    (staffPermissionResult.data ??
      []) as StaffPermissionRow[];

  /*
   * STAFF CAN RECEIVE ONLY
   * NON-SENSITIVE PERMISSIONS.
   */
  const safePermissions =
    allPermissions.filter(
      (permission) =>
        !permission.is_sensitive
    );

  const getUserPermissionSet = (
    userId: string
  ) =>
    staffPermissions
      .filter(
        (item) =>
          item.user_id === userId &&
          item.is_allowed
      )
      .map(
        (item) => item.permission
      );

  const getAdminCanManageStaff = (
    userId: string
  ) => {
    const permissionSet =
      new Set(
        getUserPermissionSet(userId)
      );

    return ADMIN_STAFF_PERMISSIONS.every(
      (permission) =>
        permissionSet.has(permission)
    );
  };

  const getResponsibilityLabels = (
    codes: string[] | null
  ) => {
    if (!codes?.length) {
      return [];
    }

    return codes.map((code) => {
      const option =
        responsibilityOptions.find(
          (item) =>
            item.code === code
        );

      return option?.label ?? code;
    });
  };

  /*
   * OWNER VIEW
   */
  const ownerTeamMembers =
    profiles.filter((profile) =>
      [
        "owner",
        "admin",
        "staff",
      ].includes(profile.role)
    );

  const promotableCustomers =
    isOwner
      ? profiles.filter(
          (profile) =>
            profile.role ===
            "customer"
        )
      : [];

  const ownerEditableProfiles =
    profiles.filter(
      (profile) =>
        profile.id !== user.id
    );

  /*
   * ADMIN VIEW
   *
   * Authorized Admin sees and edits
   * STAFF ONLY.
   */
  const adminStaffMembers =
    profiles.filter(
      (profile) =>
        profile.role === "staff"
    );

  const visibleTeamMembers =
    isOwner
      ? ownerTeamMembers
      : adminStaffMembers;

  const editableProfiles =
    isOwner
      ? ownerEditableProfiles
      : adminStaffMembers;

  return (
    <>
      <Header />

      <main className="section-shell page-space">
        <div className="shop-heading">
          <div>
            <div className="eyebrow">
              {isOwner
                ? "OWNER CONTROL"
                : "ADMIN STAFF CONTROL"}
            </div>

            <h1>
              Team Management
            </h1>

            <p>
              {isOwner
                ? "Manage Admin and Staff accounts, responsibilities and access."
                : "Manage Staff responsibilities, permissions and account status."}
            </p>
          </div>

          <a
            href="/admin"
            className="primary-button"
          >
            Back to Dashboard
          </a>
        </div>

        {/* SUMMARY */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginBottom: "2.5rem",
          }}
        >
          <SummaryCard
            label={
              isOwner
                ? "Total Team"
                : "Total Staff"
            }
            value={
              visibleTeamMembers.length
            }
          />

          {isOwner && (
            <SummaryCard
              label="Admins"
              value={
                ownerTeamMembers.filter(
                  (item) =>
                    item.role ===
                    "admin"
                ).length
              }
            />
          )}

          <SummaryCard
            label="Staff"
            value={
              visibleTeamMembers.filter(
                (item) =>
                  item.role === "staff"
              ).length
            }
          />

          <SummaryCard
            label="Active"
            value={
              visibleTeamMembers.filter(
                (item) =>
                  item.is_active
              ).length
            }
          />
        </section>

        {/* TEAM LIST */}
        <section
          style={{
            marginBottom: "3rem",
          }}
        >
          <div className="shop-heading">
            <div>
              <div className="eyebrow">
                {isOwner
                  ? "ALL TEAM MEMBERS"
                  : "STAFF MEMBERS"}
              </div>

              <h2>
                {isOwner
                  ? "Admin & Staff"
                  : "Staff"}
              </h2>

              <p>
                {isOwner
                  ? "All Admin and Staff accounts are shown here."
                  : "Only Staff accounts you are authorized to manage are shown here."}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            {visibleTeamMembers.length ===
            0 ? (
              <div className="empty-box">
                No team members found.
              </div>
            ) : (
              visibleTeamMembers.map(
                (member) => {
                  const responsibilityLabels =
                    getResponsibilityLabels(
                      member.responsibilities
                    );

                  const memberIsOwner =
                    member.role ===
                    "owner";

                  return (
                    <div
                      key={member.id}
                      className="empty-box"
                      style={{
                        textAlign:
                          "left",
                        display:
                          "grid",
                        gridTemplateColumns:
                          "minmax(0, 1fr) auto",
                        gap: "1rem",
                        alignItems:
                          "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            flexWrap:
                              "wrap",
                            gap: "8px",
                            marginBottom:
                              "6px",
                          }}
                        >
                          <strong
                            style={{
                              fontSize:
                                "1.1rem",
                            }}
                          >
                            {member.full_name ||
                              "No name"}
                          </strong>

                          <span
                            style={
                              roleBadge
                            }
                          >
                            {member.role.toUpperCase()}
                          </span>

                          <span
                            style={
                              member.is_active
                                ? activeBadge
                                : disabledBadge
                            }
                          >
                            {member.is_active
                              ? "ACTIVE"
                              : "DISABLED"}
                          </span>
                        </div>

                        <p
                          style={{
                            marginBottom:
                              "4px",
                          }}
                        >
                          {member.email}
                        </p>

                        <p
                          style={{
                            marginBottom:
                              "4px",
                          }}
                        >
                          Department:{" "}
                          <strong>
                            {member.department ||
                              "—"}
                          </strong>
                        </p>

                        <p
                          style={{
                            marginBottom:
                              "4px",
                          }}
                        >
                          Responsibilities:{" "}
                          <strong>
                            {responsibilityLabels.length
                              ? responsibilityLabels.join(
                                  ", "
                                )
                              : "None assigned"}
                          </strong>
                        </p>

                        {isOwner &&
                          member.role ===
                            "admin" && (
                            <p
                              style={{
                                marginBottom:
                                  0,
                              }}
                            >
                              Staff
                              Management:{" "}
                              <strong>
                                {getAdminCanManageStaff(
                                  member.id
                                )
                                  ? "ON"
                                  : "OFF"}
                              </strong>
                            </p>
                          )}
                      </div>

                      {memberIsOwner ? (
                        <span
                          style={{
                            fontWeight:
                              700,
                          }}
                        >
                          Protected Owner
                        </span>
                      ) : (
                        <a
                          href={`#edit-${member.id}`}
                          className="admin-action-button"
                        >
                          Edit Access
                        </a>
                      )}
                    </div>
                  );
                }
              )
            )}
          </div>
        </section>

        {/* CUSTOMER PROMOTION — OWNER ONLY */}
        {isOwner &&
          promotableCustomers.length >
            0 && (
            <section
              style={{
                marginBottom:
                  "3rem",
              }}
            >
              <div className="shop-heading">
                <div>
                  <div className="eyebrow">
                    PROMOTE ACCOUNT
                  </div>

                  <h2>
                    Available Customer
                    Accounts
                  </h2>

                  <p>
                    Promote a customer
                    account to Staff or
                    Admin.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "1rem",
                }}
              >
                {promotableCustomers.map(
                  (customer) => (
                    <div
                      key={
                        customer.id
                      }
                      className="empty-box"
                      style={{
                        textAlign:
                          "left",
                      }}
                    >
                      <strong>
                        {customer.full_name ||
                          "No name"}
                      </strong>

                      <p>
                        {customer.email}
                      </p>

                      <a
                        href={`#edit-${customer.id}`}
                        className="admin-action-button"
                      >
                        Set Team Access
                      </a>
                    </div>
                  )
                )}
              </div>
            </section>
          )}

        {/* ACCESS EDITOR */}
        <section>
          <div className="shop-heading">
            <div>
              <div className="eyebrow">
                ACCESS EDITOR
              </div>

              <h2>
                {isOwner
                  ? "Edit Team Access"
                  : "Edit Staff Access"}
              </h2>

              <p>
                {isOwner
                  ? "Open only the person you want to manage."
                  : "You can edit Staff only. Owner and Admin accounts remain protected."}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            {editableProfiles.length ===
            0 ? (
              <div className="empty-box">
                No editable team
                members found.
              </div>
            ) : (
              editableProfiles.map(
                (profile) => (
                  <TeamMemberAccessCard
                    key={profile.id}
                    profile={
                      /*
                       * For Admin view,
                       * role is already
                       * Staff only.
                       */
                      profile
                    }
                    responsibilityOptions={
                      responsibilityOptions
                    }
                    permissions={
                      safePermissions
                    }
                    selectedPermissions={getUserPermissionSet(
                      profile.id
                    )}
                    canManageStaff={
                      isOwner &&
                      profile.role ===
                        "admin"
                        ? getAdminCanManageStaff(
                            profile.id
                          )
                        : false
                    }
                    action={
                      saveTeamAccessAction
                    }
                  />
                )
              )
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="empty-box">
      <strong>{label}</strong>
      <h2>{value}</h2>
    </div>
  );
}

const roleBadge = {
  display: "inline-block",
  padding: "4px 8px",
  borderRadius: "999px",
  border: "1px solid #ddd",
  fontSize: "0.75rem",
  fontWeight: 700,
};

const activeBadge = {
  ...roleBadge,
  background: "#ecfdf5",
};

const disabledBadge = {
  ...roleBadge,
  background: "#fef2f2",
};