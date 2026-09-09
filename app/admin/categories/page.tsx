"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  store_section: string | null;
  is_active: boolean;
  sort_order: number | null;
};

type PermissionState = {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

const emptyPermissions: PermissionState = {
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [permissions, setPermissions] =
    useState<PermissionState>(emptyPermissions);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(
    null
  );

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [storeSection, setStoreSection] = useState("books");
  const [parentId, setParentId] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    if (!supabase) {
      setLoading(false);
      setErrorMessage("Supabase is not connected.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/account";
      return;
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .single();

    if (
      profileError ||
      !profile ||
      !profile.is_active ||
      !["owner", "admin", "staff"].includes(profile.role)
    ) {
      window.location.href = "/account";
      return;
    }

    const [
      viewResult,
      createResult,
      editResult,
      deleteResult,
    ] = await Promise.all([
      supabase.rpc("has_permission", {
        required_permission: "categories.view",
      }),

      supabase.rpc("has_permission", {
        required_permission: "categories.create",
      }),

      supabase.rpc("has_permission", {
        required_permission: "categories.edit",
      }),

      supabase.rpc("has_permission", {
        required_permission: "categories.delete",
      }),
    ]);

    const nextPermissions: PermissionState = {
      canView:
        !viewResult.error && viewResult.data === true,

      canCreate:
        !createResult.error && createResult.data === true,

      canEdit:
        !editResult.error && editResult.data === true,

      canDelete:
        !deleteResult.error && deleteResult.data === true,
    };

    const hasAnyCategoryAccess =
      nextPermissions.canView ||
      nextPermissions.canCreate ||
      nextPermissions.canEdit ||
      nextPermissions.canDelete;

    if (!hasAnyCategoryAccess) {
      window.location.href = "/admin";
      return;
    }

    setPermissions(nextPermissions);

    await loadCategories();
    setLoading(false);
  }

  async function loadCategories() {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("categories")
      .select(
        `
        id,
        name,
        slug,
        parent_id,
        store_section,
        is_active,
        sort_order
        `
      )
      .order("store_section", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Category load error:", error);
      setErrorMessage(
        `Could not load categories: ${error.message}`
      );
      setCategories([]);
      return;
    }

    setCategories((data ?? []) as Category[]);
  }

  function clearMessages() {
    setMessage("");
    setErrorMessage("");
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setSlug("");
    setStoreSection("books");
    setParentId("");
    setSortOrder("0");
    setIsActive(true);
  }

  function makeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleNameChange(value: string) {
    setName(value);

    if (!editingId) {
      setSlug(makeSlug(value));
    }
  }

  const rootCategories = useMemo(() => {
    return categories.filter(
      (category) => category.parent_id === null
    );
  }, [categories]);

  const possibleParents = useMemo(() => {
    return rootCategories.filter((category) => {
      if (editingId && category.id === editingId) {
        return false;
      }

      return (
        (category.store_section ?? "").toLowerCase() ===
        storeSection.toLowerCase()
      );
    });
  }, [rootCategories, storeSection, editingId]);

  const groupedCategories = useMemo(() => {
    const groups: Record<string, Category[]> = {};

    categories.forEach((category) => {
      const section =
        category.store_section?.trim() || "Other";

      if (!groups[section]) {
        groups[section] = [];
      }

      groups[section].push(category);
    });

    return groups;
  }, [categories]);

  async function handleSave() {
    if (!supabase) {
      setErrorMessage("Supabase is not connected.");
      return;
    }

    clearMessages();

    if (editingId && !permissions.canEdit) {
      setErrorMessage(
        "You do not have permission to edit categories."
      );
      return;
    }

    if (!editingId && !permissions.canCreate) {
      setErrorMessage(
        "You do not have permission to create categories."
      );
      return;
    }

    const cleanName = name.trim();
    const cleanSlug = makeSlug(slug);

    if (!cleanName) {
      setErrorMessage("Category name is required.");
      return;
    }

    if (!cleanSlug) {
      setErrorMessage("Category slug is required.");
      return;
    }

    const numericSortOrder = Number(sortOrder);

    if (
      Number.isNaN(numericSortOrder) ||
      !Number.isInteger(numericSortOrder)
    ) {
      setErrorMessage("Sort order must be a whole number.");
      return;
    }

    setSaving(true);

    const payload = {
      name: cleanName,
      slug: cleanSlug,
      parent_id: parentId || null,
      store_section: storeSection,
      is_active: isActive,
      sort_order: numericSortOrder,
    };

    if (editingId) {
      const { error } = await supabase
        .from("categories")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        console.error("Category update error:", error);
        setErrorMessage(
          `Could not update category: ${error.message}`
        );
        setSaving(false);
        return;
      }

      setMessage("Category updated successfully.");
    } else {
      const { error } = await supabase
        .from("categories")
        .insert(payload);

      if (error) {
        console.error("Category create error:", error);
        setErrorMessage(
          `Could not create category: ${error.message}`
        );
        setSaving(false);
        return;
      }

      setMessage("Category created successfully.");
    }

    await loadCategories();
    resetForm();
    setSaving(false);
  }

  function startEdit(category: Category) {
    if (!permissions.canEdit) {
      setErrorMessage(
        "You do not have permission to edit categories."
      );
      return;
    }

    clearMessages();

    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setStoreSection(category.store_section || "books");
    setParentId(category.parent_id || "");
    setSortOrder(String(category.sort_order ?? 0));
    setIsActive(category.is_active);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function toggleActive(category: Category) {
    if (!supabase) return;

    if (!permissions.canEdit) {
      setErrorMessage(
        "You do not have permission to edit categories."
      );
      return;
    }

    clearMessages();

    const { error } = await supabase
      .from("categories")
      .update({
        is_active: !category.is_active,
      })
      .eq("id", category.id);

    if (error) {
      setErrorMessage(
        `Could not change category status: ${error.message}`
      );
      return;
    }

    setMessage(
      category.is_active
        ? "Category disabled."
        : "Category enabled."
    );

    await loadCategories();
  }

  async function deleteCategory(category: Category) {
    if (!supabase) return;

    if (!permissions.canDelete) {
      setErrorMessage(
        "You do not have permission to delete categories."
      );
      return;
    }

    const hasChildren = categories.some(
      (item) => item.parent_id === category.id
    );

    if (hasChildren) {
      setErrorMessage(
        "This category has subcategories. Delete or move them first."
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete category "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    clearMessages();
    setDeletingId(category.id);

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);

    if (error) {
      console.error("Category delete error:", error);

      setErrorMessage(
        `Could not delete category: ${error.message}`
      );

      setDeletingId(null);
      return;
    }

    if (editingId === category.id) {
      resetForm();
    }

    setMessage("Category deleted successfully.");
    await loadCategories();

    setDeletingId(null);
  }

  function getParentName(parentIdValue: string | null) {
    if (!parentIdValue) {
      return "Main Category";
    }

    return (
      categories.find(
        (category) => category.id === parentIdValue
      )?.name || "Unknown Parent"
    );
  }

  if (loading) {
    return (
      <>
        <Header />

        <main className="section-shell simple-page">
          <h1>Loading Categories...</h1>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="section-shell page-space">
        <div className="eyebrow">
          JIPLANCE ADMIN
        </div>

        <h1>Category Management</h1>

        <p>
          Manage Books and Fashion categories with
          permission-based access.
        </p>

        {message && (
          <div style={successStyle}>
            {message}
          </div>
        )}

        {errorMessage && (
          <div style={errorStyle}>
            {errorMessage}
          </div>
        )}

        {(permissions.canCreate || permissions.canEdit) && (
          <section style={panelStyle}>
            <div className="eyebrow">
              {editingId
                ? "EDIT CATEGORY"
                : "CREATE CATEGORY"}
            </div>

            <h2>
              {editingId
                ? "Update Category"
                : "Add New Category"}
            </h2>

            <div style={formGridStyle}>
              <label style={labelStyle}>
                Category Name *

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    handleNameChange(event.target.value)
                  }
                  placeholder="Example: Story Books"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Slug *

                <input
                  type="text"
                  value={slug}
                  onChange={(event) =>
                    setSlug(event.target.value)
                  }
                  placeholder="story-books"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Store Section *

                <select
                  value={storeSection}
                  onChange={(event) => {
                    setStoreSection(event.target.value);
                    setParentId("");
                  }}
                  style={inputStyle}
                >
                  <option value="books">Books</option>
                  <option value="fashion">Fashion</option>
                </select>
              </label>

              <label style={labelStyle}>
                Parent Category

                <select
                  value={parentId}
                  onChange={(event) =>
                    setParentId(event.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="">
                    No Parent — Main Category
                  </option>

                  {possibleParents.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Sort Order

                <input
                  type="number"
                  step="1"
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(event.target.value)
                  }
                  style={inputStyle}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.65rem",
                  marginTop: "1.9rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) =>
                    setIsActive(event.target.checked)
                  }
                />

                Active Category
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
                marginTop: "1.25rem",
              }}
            >
              <button
                type="button"
                className="primary-button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Save Changes"
                  : "Create Category"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={secondaryButtonStyle}
                  disabled={saving}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </section>
        )}

        <section style={panelStyle}>
          <div className="eyebrow">
            CATEGORY DIRECTORY
          </div>

          <h2>All Categories</h2>

          {Object.keys(groupedCategories).length === 0 ? (
            <div className="empty-box">
              No categories found.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "1.5rem",
              }}
            >
              {Object.entries(groupedCategories).map(
                ([section, sectionCategories]) => (
                  <div key={section}>
                    <h3
                      style={{
                        textTransform: "capitalize",
                      }}
                    >
                      {section}
                    </h3>

                    <div
                      style={{
                        display: "grid",
                        gap: "0.8rem",
                      }}
                    >
                      {sectionCategories.map((category) => (
                        <div
                          key={category.id}
                          style={categoryCardStyle}
                        >
                          <div>
                            <strong>{category.name}</strong>

                            <div
                              style={{
                                marginTop: "0.35rem",
                                opacity: 0.72,
                                fontSize: "0.92rem",
                              }}
                            >
                              {category.slug}
                              {" • "}
                              {getParentName(category.parent_id)}
                              {" • "}
                              Order {category.sort_order ?? 0}
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.65rem",
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                padding: "0.35rem 0.65rem",
                                borderRadius: "999px",
                                fontSize: "0.82rem",
                                fontWeight: 700,
                                background: category.is_active
                                  ? "rgba(34,197,94,0.14)"
                                  : "rgba(239,68,68,0.14)",
                              }}
                            >
                              {category.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>

                            {permissions.canEdit && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    startEdit(category)
                                  }
                                  style={secondaryButtonStyle}
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleActive(category)
                                  }
                                  style={secondaryButtonStyle}
                                >
                                  {category.is_active
                                    ? "Disable"
                                    : "Enable"}
                                </button>
                              </>
                            )}

                            {permissions.canDelete && (
                              <button
                                type="button"
                                onClick={() =>
                                  deleteCategory(category)
                                }
                                disabled={
                                  deletingId === category.id
                                }
                                style={deleteButtonStyle}
                              >
                                {deletingId === category.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <div
          style={{
            marginTop: "1.5rem",
          }}
        >
          <a href="/admin">
            ← Back to Dashboard
          </a>
        </div>
      </main>

      <Footer />
    </>
  );
}

const panelStyle: React.CSSProperties = {
  marginTop: "1.5rem",
  padding: "1.5rem",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "18px",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.45rem",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.8rem",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "transparent",
  color: "inherit",
};

const categoryCardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap",
  padding: "1rem",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "14px",
};

const successStyle: React.CSSProperties = {
  marginTop: "1rem",
  padding: "0.9rem 1rem",
  borderRadius: "10px",
  background: "rgba(34,197,94,0.12)",
};

const errorStyle: React.CSSProperties = {
  marginTop: "1rem",
  padding: "0.9rem 1rem",
  borderRadius: "10px",
  background: "rgba(239,68,68,0.12)",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "0.7rem 0.9rem",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
};

const deleteButtonStyle: React.CSSProperties = {
  padding: "0.7rem 0.9rem",
  borderRadius: "10px",
  border: "1px solid rgba(239,68,68,0.45)",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
};