"use client";

import {
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

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

type Props = {
  profile: ProfileRow;
  responsibilityOptions: ResponsibilityOption[];
  permissions: PermissionRow[];
  selectedPermissions: string[];
  canManageStaff: boolean;
  action: (
    formData: FormData
  ) => void | Promise<void>;
};

type SaveStatus =
  | "idle"
  | "saving"
  | "success"
  | "error";

export default function TeamMemberAccessCard({
  profile,
  responsibilityOptions,
  permissions,
  selectedPermissions,
  canManageStaff,
  action,
}: Props) {
  const router = useRouter();

  const [open, setOpen] =
    useState(false);

  const [selectedRole, setSelectedRole] =
    useState(profile.role);

  const [saveStatus, setSaveStatus] =
    useState<SaveStatus>("idle");

  const [errorMessage, setErrorMessage] =
    useState("");

  const resetTimerRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const responsibilityCategories =
    Array.from(
      new Set(
        responsibilityOptions.map(
          (item) => item.category
        )
      )
    );

  const permissionGroups =
    Array.from(
      new Set(
        permissions.map(
          (item) =>
            item.permission_group
        )
      )
    );

  const currentResponsibilities =
    responsibilityOptions
      .filter((option) =>
        profile.responsibilities?.includes(
          option.code
        )
      )
      .map(
        (option) => option.label
      );

  const currentPermissionLabels =
    permissions
      .filter((permission) =>
        selectedPermissions.includes(
          permission.code
        )
      )
      .map(
        (permission) =>
          permission.name
      );

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saveStatus === "saving") {
      return;
    }

    if (resetTimerRef.current) {
      clearTimeout(
        resetTimerRef.current
      );
    }

    setSaveStatus("saving");
    setErrorMessage("");

    const formData =
      new FormData(
        event.currentTarget
      );

    try {
      await action(formData);

      setSaveStatus("success");

      resetTimerRef.current =
        setTimeout(() => {
          setSaveStatus("idle");
          router.refresh();
        }, 1800);
    } catch (error) {
      console.error(
        "Team access save error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while saving.";

      setErrorMessage(message);
      setSaveStatus("error");

      resetTimerRef.current =
        setTimeout(() => {
          setSaveStatus("idle");
          setErrorMessage("");
        }, 5000);
    }
  }

  return (
    <div
      id={`edit-${profile.id}`}
      className="empty-box"
      style={{
        textAlign: "left",
        transition:
          "border-color 0.25s ease, box-shadow 0.25s ease",
        border:
          saveStatus === "success"
            ? "1px solid #16a34a"
            : saveStatus === "error"
            ? "1px solid #dc2626"
            : undefined,
        boxShadow:
          saveStatus === "success"
            ? "0 0 0 3px rgba(22, 163, 74, 0.10)"
            : saveStatus === "error"
            ? "0 0 0 3px rgba(220, 38, 38, 0.10)"
            : undefined,
      }}
    >
      <style jsx>{`
        @keyframes jiplance-spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes jiplance-pop {
          0% {
            transform: scale(0.92);
            opacity: 0;
          }

          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes jiplance-pulse {
          0%,
          100% {
            box-shadow: 0 0 0
              0
              rgba(
                22,
                163,
                74,
                0.35
              );
          }

          50% {
            box-shadow: 0 0 0
              7px
              rgba(
                22,
                163,
                74,
                0
              );
          }
        }
      `}</style>

      <button
        type="button"
        onClick={() =>
          setOpen(!open)
        }
        style={{
          width: "100%",
          border: 0,
          background:
            "transparent",
          cursor: "pointer",
          padding: 0,
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div>
            <strong
              style={{
                fontSize:
                  "1.1rem",
              }}
            >
              {profile.full_name ||
                "No name"}
            </strong>

            <p
              style={{
                marginBottom:
                  "4px",
              }}
            >
              {profile.email}
            </p>

            <small>
              {profile.role.toUpperCase()}{" "}
              •{" "}
              {profile.department ||
                "No department"}{" "}
              •{" "}
              {profile.is_active
                ? "Active"
                : "Disabled"}
            </small>
          </div>

          <strong>
            {open
              ? "Close Editor ▲"
              : "Edit Access ▼"}
          </strong>
        </div>
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: "2rem",
            borderTop:
              "1px solid #e5e5e5",
            paddingTop: "2rem",
          }}
        >
          <input
            type="hidden"
            name="user_id"
            value={profile.id}
          />

          <section
            style={sectionStyle}
          >
            <h3>
              Current Access Summary
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              <SummaryItem
                label="Role"
                value={profile.role.toUpperCase()}
              />

              <SummaryItem
                label="Department"
                value={
                  profile.department ||
                  "Not assigned"
                }
              />

              <SummaryItem
                label="Status"
                value={
                  profile.is_active
                    ? "Active"
                    : "Disabled"
                }
              />
            </div>

            <div
              style={{
                marginTop:
                  "1.25rem",
              }}
            >
              <strong>
                Responsibilities
              </strong>

              <p>
                {currentResponsibilities.length
                  ? currentResponsibilities.join(
                      ", "
                    )
                  : "No responsibilities assigned"}
              </p>
            </div>

            {profile.role ===
              "staff" && (
              <div
                style={{
                  marginTop:
                    "1.25rem",
                }}
              >
                <strong>
                  Current Permissions
                </strong>

                <p>
                  {currentPermissionLabels.length
                    ? currentPermissionLabels.join(
                        ", "
                      )
                    : "No permissions assigned"}
                </p>
              </div>
            )}

            {profile.role ===
              "admin" && (
              <div
                style={{
                  marginTop:
                    "1.25rem",
                }}
              >
                <strong>
                  Staff Management
                </strong>

                <p>
                  {canManageStaff
                    ? "ON"
                    : "OFF"}
                </p>
              </div>
            )}
          </section>

          <section
            style={sectionStyle}
          >
            <h3>Basic Access</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              <label>
                Role

                <select
                  name="role"
                  value={
                    selectedRole
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedRole(
                      event.target
                        .value
                    )
                  }
                  style={inputStyle}
                  disabled={
                    saveStatus ===
                    "saving"
                  }
                >
                  <option value="staff">
                    Staff
                  </option>

                  <option value="admin">
                    Admin
                  </option>

                  <option value="customer">
                    Customer
                  </option>
                </select>
              </label>

              <label>
                Department

                <select
                  name="department"
                  defaultValue={
                    profile.department ||
                    "Operations"
                  }
                  style={inputStyle}
                  disabled={
                    saveStatus ===
                    "saving"
                  }
                >
                  <option value="Operations">
                    Operations
                  </option>

                  <option value="Products">
                    Products
                  </option>

                  <option value="Customer Support">
                    Customer Support
                  </option>

                  <option value="Content">
                    Content
                  </option>

                  <option value="Marketing">
                    Marketing
                  </option>

                  <option value="Management">
                    Management
                  </option>
                </select>
              </label>

              <label>
                Account Status

                <select
                  name="is_active"
                  defaultValue={
                    profile.is_active
                      ? "true"
                      : "false"
                  }
                  style={inputStyle}
                  disabled={
                    saveStatus ===
                    "saving"
                  }
                >
                  <option value="true">
                    Active
                  </option>

                  <option value="false">
                    Disabled
                  </option>
                </select>
              </label>
            </div>
          </section>

          {(selectedRole ===
            "staff" ||
            selectedRole ===
              "admin") && (
            <section
              style={sectionStyle}
            >
              <h3>
                Responsibilities
              </h3>

              <p>
                Select one or multiple
                job responsibilities.
              </p>

              {responsibilityCategories.map(
                (category) => (
                  <div
                    key={category}
                    style={{
                      marginTop:
                        "1.25rem",
                    }}
                  >
                    <strong>
                      {category}
                    </strong>

                    <div
                      style={
                        gridStyle
                      }
                    >
                      {responsibilityOptions
                        .filter(
                          (item) =>
                            item.category ===
                            category
                        )
                        .map(
                          (item) => (
                            <label
                              key={
                                item.id
                              }
                              style={
                                checkStyle
                              }
                            >
                              <input
                                type="checkbox"
                                name="responsibilities"
                                value={
                                  item.code
                                }
                                disabled={
                                  saveStatus ===
                                  "saving"
                                }
                                defaultChecked={
                                  profile.responsibilities?.includes(
                                    item.code
                                  ) ??
                                  false
                                }
                              />

                              {
                                item.label
                              }
                            </label>
                          )
                        )}
                    </div>
                  </div>
                )
              )}
            </section>
          )}

          {selectedRole ===
            "staff" && (
            <section
              style={sectionStyle}
            >
              <h3>
                Staff Permissions
              </h3>

              <p>
                These decide what this
                Staff account can
                actually access.
              </p>

              {permissionGroups.map(
                (group) => (
                  <div
                    key={group}
                    style={{
                      marginTop:
                        "1.25rem",
                    }}
                  >
                    <strong>
                      {group}
                    </strong>

                    <div
                      style={
                        gridStyle
                      }
                    >
                      {permissions
                        .filter(
                          (item) =>
                            item.permission_group ===
                            group
                        )
                        .map(
                          (item) => (
                            <label
                              key={
                                item.code
                              }
                              style={
                                checkStyle
                              }
                            >
                              <input
                                type="checkbox"
                                name="permissions"
                                value={
                                  item.code
                                }
                                disabled={
                                  saveStatus ===
                                  "saving"
                                }
                                defaultChecked={selectedPermissions.includes(
                                  item.code
                                )}
                              />

                              <span>
                                <strong
                                  style={{
                                    display:
                                      "block",
                                  }}
                                >
                                  {
                                    item.name
                                  }
                                </strong>

                                {item.description && (
                                  <small>
                                    {
                                      item.description
                                    }
                                  </small>
                                )}
                              </span>
                            </label>
                          )
                        )}
                    </div>
                  </div>
                )
              )}
            </section>
          )}

          {selectedRole ===
            "admin" && (
            <section
              style={sectionStyle}
            >
              <h3>
                Admin Control
              </h3>

              <p>
                Owner decides whether
                this Admin can control
                Staff accounts.
              </p>

              <label
                style={{
                  ...checkStyle,
                  marginTop:
                    "1rem",
                  maxWidth:
                    "420px",
                }}
              >
                <input
                  type="checkbox"
                  name="can_manage_staff"
                  value="true"
                  disabled={
                    saveStatus ===
                    "saving"
                  }
                  defaultChecked={
                    canManageStaff
                  }
                />

                <span>
                  <strong>
                    Can Manage Staff
                  </strong>

                  <small
                    style={{
                      display:
                        "block",
                    }}
                  >
                    Allows this Admin
                    to manage Staff
                    access. Owner and
                    other Admin accounts
                    remain protected.
                  </small>
                </span>
              </label>
            </section>
          )}

          {/* SAVE FEEDBACK */}
          {saveStatus !== "idle" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding:
                  "12px 14px",
                marginBottom:
                  "14px",
                borderRadius:
                  "10px",
                border:
                  saveStatus ===
                  "success"
                    ? "1px solid #16a34a"
                    : saveStatus ===
                      "error"
                    ? "1px solid #dc2626"
                    : "1px solid #d1d5db",
                background:
                  saveStatus ===
                  "success"
                    ? "#f0fdf4"
                    : saveStatus ===
                      "error"
                    ? "#fef2f2"
                    : "#f8fafc",
                animation:
                  "jiplance-pop 0.22s ease-out",
              }}
            >
              {saveStatus ===
                "saving" && (
                <span
                  style={{
                    width: "18px",
                    height:
                      "18px",
                    border:
                      "2px solid #cbd5e1",
                    borderTopColor:
                      "#1f294d",
                    borderRadius:
                      "50%",
                    flexShrink: 0,
                    animation:
                      "jiplance-spin 0.7s linear infinite",
                  }}
                />
              )}

              {saveStatus ===
                "success" && (
                <span
                  style={{
                    width: "14px",
                    height:
                      "14px",
                    borderRadius:
                      "50%",
                    background:
                      "#16a34a",
                    flexShrink: 0,
                    animation:
                      "jiplance-pulse 1s ease-in-out infinite",
                  }}
                />
              )}

              {saveStatus ===
                "error" && (
                <span
                  style={{
                    width: "14px",
                    height:
                      "14px",
                    borderRadius:
                      "50%",
                    background:
                      "#dc2626",
                    flexShrink: 0,
                  }}
                />
              )}

              <strong
                style={{
                  color:
                    saveStatus ===
                    "success"
                      ? "#166534"
                      : saveStatus ===
                        "error"
                      ? "#991b1b"
                      : "#334155",
                }}
              >
                {saveStatus ===
                  "saving"
                  ? "Saving changes..."
                  : saveStatus ===
                    "success"
                  ? "Team access saved successfully ✓"
                  : errorMessage ||
                    "Could not save changes."}
              </strong>
            </div>
          )}

          <button
            type="submit"
            className="admin-action-button"
            disabled={
              saveStatus ===
              "saving"
            }
            style={{
              minWidth: "180px",
              cursor:
                saveStatus ===
                "saving"
                  ? "wait"
                  : "pointer",
              opacity:
                saveStatus ===
                "saving"
                  ? 0.7
                  : 1,
              transition:
                "all 0.2s ease",
              background:
                saveStatus ===
                "success"
                  ? "#16a34a"
                  : saveStatus ===
                    "error"
                  ? "#dc2626"
                  : undefined,
              color:
                saveStatus ===
                  "success" ||
                saveStatus ===
                  "error"
                  ? "#ffffff"
                  : undefined,
            }}
          >
            {saveStatus ===
            "saving"
              ? "Saving..."
              : saveStatus ===
                "success"
              ? "Saved ✓"
              : saveStatus ===
                "error"
              ? "Try Again"
              : "Save Team Access"}
          </button>
        </form>
      )}
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: "12px",
        border:
          "1px solid #e5e5e5",
        borderRadius: "10px",
      }}
    >
      <small
        style={{
          display: "block",
          marginBottom: "4px",
        }}
      >
        {label}
      </small>

      <strong>{value}</strong>
    </div>
  );
}

const sectionStyle = {
  marginBottom: "2rem",
  padding: "1.25rem",
  border:
    "1px solid #e5e5e5",
  borderRadius: "12px",
};

const inputStyle = {
  width: "100%",
  display: "block",
  marginTop: "7px",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  background: "white",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "10px",
  marginTop: "10px",
};

const checkStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  cursor: "pointer",
  padding: "10px",
  border:
    "1px solid #e5e5e5",
  borderRadius: "8px",
};