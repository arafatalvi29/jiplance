"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type HeroImage = {
  id: string;
  slot: number;
  image_url: string | null;
  storage_path: string | null;
  updated_at: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function AdminHomepageHeroPage() {
  const [images, setImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState<number | null>(null);

  const [pendingFiles, setPendingFiles] = useState<
    Record<number, File | null>
  >({
    1: null,
    2: null,
    3: null,
  });

  const [previewUrls, setPreviewUrls] = useState<
    Record<number, string | null>
  >({
    1: null,
    2: null,
    3: null,
  });

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function loadImages() {
    const client = supabase;

    if (!client) {
      setMessage({
        type: "error",
        text: "Supabase connection is unavailable.",
      });

      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await client
        .from("homepage_hero_images")
        .select(
          "id, slot, image_url, storage_path, updated_at"
        )
        .order("slot", { ascending: true });

      if (error) {
        throw error;
      }

      setImages((data ?? []) as HeroImage[]);
    } catch (error) {
      console.error("Failed to load hero images:", error);

      setMessage({
        type: "error",
        text: "Could not load homepage hero images.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadImages();
  }, []);

  function getSlot(slot: number) {
    return images.find((item) => item.slot === slot);
  }

  function clearPendingPreview(slot: number) {
    const oldPreview = previewUrls[slot];

    if (oldPreview) {
      URL.revokeObjectURL(oldPreview);
    }

    setPendingFiles((current) => ({
      ...current,
      [slot]: null,
    }));

    setPreviewUrls((current) => ({
      ...current,
      [slot]: null,
    }));
  }

  function handleFileChange(
    slot: number,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage(null);

    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: "error",
        text: "Please upload a JPG, PNG or WEBP image.",
      });

      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage({
        type: "error",
        text: "Image must be smaller than 5 MB.",
      });

      event.target.value = "";
      return;
    }

    const previousPreview = previewUrls[slot];

    if (previousPreview) {
      URL.revokeObjectURL(previousPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setPendingFiles((current) => ({
      ...current,
      [slot]: file,
    }));

    setPreviewUrls((current) => ({
      ...current,
      [slot]: previewUrl,
    }));
  }

  async function saveImage(slot: number) {
    const client = supabase;
    const file = pendingFiles[slot];
    const currentImage = getSlot(slot);

    if (!client) {
      setMessage({
        type: "error",
        text: "Supabase connection is unavailable.",
      });
      return;
    }

    if (!file) {
      setMessage({
        type: "error",
        text: `Choose an image for Slot ${slot} first.`,
      });
      return;
    }

    try {
      setSavingSlot(slot);
      setMessage(null);

      let extension = "jpg";

      if (file.type === "image/png") {
        extension = "png";
      }

      if (file.type === "image/webp") {
        extension = "webp";
      }

      const uniqueId =
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`;

      const storagePath =
        `hero/slot-${slot}/` +
        `${Date.now()}-${uniqueId}.${extension}`;

      const { error: uploadError } = await client.storage
        .from("homepage-assets")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = client.storage
        .from("homepage-assets")
        .getPublicUrl(storagePath);

      const publicUrl = publicUrlData.publicUrl;

      const { error: updateError } = await client
        .from("homepage_hero_images")
        .update({
          image_url: publicUrl,
          storage_path: storagePath,
          updated_at: new Date().toISOString(),
        })
        .eq("slot", slot);

      if (updateError) {
        await client.storage
          .from("homepage-assets")
          .remove([storagePath]);

        throw updateError;
      }

      /*
       * Delete the previous image only AFTER
       * the new image has been saved successfully.
       */
      if (
        currentImage?.storage_path &&
        currentImage.storage_path !== storagePath
      ) {
        const { error: removeOldError } =
          await client.storage
            .from("homepage-assets")
            .remove([currentImage.storage_path]);

        if (removeOldError) {
          console.warn(
            "Old hero image could not be removed:",
            removeOldError
          );
        }
      }

      clearPendingPreview(slot);

      await loadImages();

      setMessage({
        type: "success",
        text: `Homepage image ${slot} saved successfully.`,
      });
    } catch (error) {
      console.error(
        `Failed to save hero image ${slot}:`,
        error
      );

      setMessage({
        type: "error",
        text: `Could not save Homepage Image ${slot}.`,
      });
    } finally {
      setSavingSlot(null);
    }
  }

  async function removeImage(slot: number) {
    const client = supabase;
    const currentImage = getSlot(slot);

    if (!client) {
      setMessage({
        type: "error",
        text: "Supabase connection is unavailable.",
      });
      return;
    }

    if (!currentImage?.image_url) {
      return;
    }

    const confirmed = window.confirm(
      `Remove Homepage Image ${slot}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSavingSlot(slot);
      setMessage(null);

      /*
       * First remove the image reference from the database.
       * This prevents a broken image from remaining
       * on the homepage if storage deletion has a problem.
       */
      const { error: updateError } = await client
        .from("homepage_hero_images")
        .update({
          image_url: null,
          storage_path: null,
          updated_at: new Date().toISOString(),
        })
        .eq("slot", slot);

      if (updateError) {
        throw updateError;
      }

      if (currentImage.storage_path) {
        const { error: storageError } =
          await client.storage
            .from("homepage-assets")
            .remove([currentImage.storage_path]);

        if (storageError) {
          console.warn(
            "Storage file could not be removed:",
            storageError
          );
        }
      }

      clearPendingPreview(slot);

      await loadImages();

      setMessage({
        type: "success",
        text: `Homepage Image ${slot} removed.`,
      });
    } catch (error) {
      console.error(
        `Failed to remove hero image ${slot}:`,
        error
      );

      setMessage({
        type: "error",
        text: `Could not remove Homepage Image ${slot}.`,
      });
    } finally {
      setSavingSlot(null);
    }
  }

  const slots = [1, 2, 3];

  return (
    <main className="heroAdminPage">
      <section className="heroAdminHeader">
        <div>
          <p className="eyebrow">
            JIPLANCE HOMEPAGE
          </p>

          <h1>Hero Images</h1>

          <p className="headerDescription">
            Manage the three product photos displayed in
            the homepage hero section. Change them anytime
            without editing website code.
          </p>
        </div>

        <div className="slotBadge">
          3 IMAGE SLOTS
        </div>
      </section>

      {message && (
        <div
          className={
            message.type === "success"
              ? "message success"
              : "message error"
          }
        >
          <span>
            {message.type === "success" ? "✓" : "!"}
          </span>

          {message.text}
        </div>
      )}

      {loading ? (
        <section className="loadingArea">
          <div className="spinner" />
          <p>Loading homepage images...</p>
        </section>
      ) : (
        <section className="imageGrid">
          {slots.map((slot) => {
            const item = getSlot(slot);
            const selectedFile = pendingFiles[slot];

            const preview =
              previewUrls[slot] ||
              item?.image_url ||
              null;

            const isSaving =
              savingSlot === slot;

            return (
              <article
                className="imageCard"
                key={slot}
              >
                <div className="cardTop">
                  <div>
                    <span className="slotNumber">
                      0{slot}
                    </span>

                    <h2>
                      Product Image {slot}
                    </h2>
                  </div>

                  <span
                    className={
                      item?.image_url
                        ? "status active"
                        : "status empty"
                    }
                  >
                    {item?.image_url
                      ? "ACTIVE"
                      : "EMPTY"}
                  </span>
                </div>

                <div className="preview">
                  {preview ? (
                    <img
                      src={preview}
                      alt={`Homepage hero slot ${slot}`}
                    />
                  ) : (
                    <div className="emptyPreview">
                      <div className="imageIcon">
                        ◇
                      </div>

                      <strong>
                        No image yet
                      </strong>

                      <span>
                        Upload a product photo
                      </span>
                    </div>
                  )}

                  {previewUrls[slot] && (
                    <div className="pendingTag">
                      NEW PREVIEW
                    </div>
                  )}
                </div>

                <div className="fileInfo">
                  {selectedFile ? (
                    <>
                      <strong>
                        Selected:
                      </strong>{" "}
                      {selectedFile.name}
                    </>
                  ) : item?.image_url ? (
                    <>
                      <strong>
                        Current image is live
                      </strong>
                    </>
                  ) : (
                    <>
                      JPG, PNG or WEBP • Max 5 MB
                    </>
                  )}
                </div>

                <label className="uploadButton">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      handleFileChange(
                        slot,
                        event
                      )
                    }
                    disabled={isSaving}
                  />

                  <span>
                    {item?.image_url
                      ? "Choose Replacement"
                      : "Choose Image"}
                  </span>
                </label>

                <div className="actionRow">
                  <button
                    type="button"
                    className="saveButton"
                    disabled={
                      !selectedFile ||
                      isSaving
                    }
                    onClick={() =>
                      saveImage(slot)
                    }
                  >
                    {isSaving
                      ? "Saving..."
                      : item?.image_url
                      ? "Save New Photo"
                      : "Save Photo"}
                  </button>

                  {selectedFile && (
                    <button
                      type="button"
                      className="cancelButton"
                      disabled={isSaving}
                      onClick={() =>
                        clearPendingPreview(
                          slot
                        )
                      }
                    >
                      Cancel
                    </button>
                  )}

                  {item?.image_url &&
                    !selectedFile && (
                      <button
                        type="button"
                        className="removeButton"
                        disabled={isSaving}
                        onClick={() =>
                          removeImage(slot)
                        }
                      >
                        Remove
                      </button>
                    )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      <section className="helpBox">
        <div className="helpIcon">
          i
        </div>

        <div>
          <strong>
            How this works
          </strong>

          <p>
            Choose a new photo and press Save.
            Once the homepage is connected in the next
            step, visitors will automatically see the
            latest saved images.
          </p>
        </div>
      </section>

      <style jsx>{`
        .heroAdminPage {
          width: 100%;
          max-width: 1450px;
          margin: 0 auto;
          padding: 32px 28px 60px;
          color: #17203d;
        }

        .heroAdminHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 30px;
          margin-bottom: 30px;
        }

        .eyebrow {
          margin: 0 0 8px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18em;
          color: #6e7691;
        }

        .heroAdminHeader h1 {
          margin: 0;
          font-size: clamp(
            32px,
            4vw,
            48px
          );
          line-height: 1;
          letter-spacing: -0.04em;
          color: #182041;
        }

        .headerDescription {
          max-width: 680px;
          margin: 15px 0 0;
          font-size: 15px;
          line-height: 1.7;
          color: #68708a;
        }

        .slotBadge {
          flex-shrink: 0;
          padding: 11px 15px;
          border: 1px solid #e2e6ef;
          border-radius: 999px;
          background: #ffffff;
          box-shadow:
            0 8px 25px
            rgba(24, 32, 65, 0.05);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.11em;
          color: #666f89;
        }

        .message {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          padding: 14px 17px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
        }

        .message span {
          display: grid;
          width: 25px;
          height: 25px;
          place-items: center;
          border-radius: 50%;
          font-weight: 900;
        }

        .message.success {
          border: 1px solid
            rgba(25, 135, 84, 0.18);
          background: #effaf4;
          color: #176d47;
        }

        .message.success span {
          background: #d9f4e5;
        }

        .message.error {
          border: 1px solid
            rgba(190, 40, 50, 0.18);
          background: #fff2f2;
          color: #a02f37;
        }

        .message.error span {
          background: #ffe0e2;
        }

        .loadingArea {
          min-height: 350px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: #737b92;
        }

        .spinner {
          width: 34px;
          height: 34px;
          border: 3px solid #e8eaf0;
          border-top-color: #1b2447;
          border-radius: 50%;
          animation: spin 0.8s
            linear infinite;
        }

        .imageGrid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 22px;
        }

        .imageCard {
          min-width: 0;
          padding: 18px;
          border: 1px solid #e7e9ef;
          border-radius: 23px;
          background: #ffffff;
          box-shadow:
            0 13px 40px
            rgba(23, 32, 61, 0.06);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .imageCard:hover {
          transform: translateY(-3px);
          box-shadow:
            0 18px 45px
            rgba(23, 32, 61, 0.09);
        }

        .cardTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 16px;
        }

        .slotNumber {
          display: block;
          margin-bottom: 4px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          color: #9299aa;
        }

        .cardTop h2 {
          margin: 0;
          font-size: 18px;
          letter-spacing: -0.02em;
          color: #1c2547;
        }

        .status {
          flex-shrink: 0;
          padding: 7px 9px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .status.active {
          background: #e7f8ee;
          color: #197247;
        }

        .status.empty {
          background: #f0f1f4;
          color: #818799;
        }

        .preview {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          border-radius: 18px;
          background:
            linear-gradient(
              145deg,
              #f4f7f5,
              #eef2f5
            );
        }

        .preview img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .emptyPreview {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          color: #8b92a4;
        }

        .imageIcon {
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          margin-bottom: 3px;
          border-radius: 16px;
          background: #ffffff;
          box-shadow:
            0 10px 30px
            rgba(24, 32, 65, 0.07);
          font-size: 27px;
          color: #2a345d;
        }

        .emptyPreview strong {
          font-size: 14px;
          color: #535c75;
        }

        .emptyPreview span {
          font-size: 12px;
        }

        .pendingTag {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(
            24,
            32,
            65,
            0.9
          );
          color: #ffffff;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.09em;
          backdrop-filter: blur(8px);
        }

        .fileInfo {
          min-height: 42px;
          display: flex;
          align-items: center;
          margin-top: 13px;
          padding: 10px 12px;
          overflow: hidden;
          border-radius: 11px;
          background: #f7f8fa;
          color: #777e91;
          font-size: 11px;
          line-height: 1.45;
          word-break: break-word;
        }

        .fileInfo strong {
          color: #4b536c;
        }

        .uploadButton {
          width: 100%;
          min-height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 12px;
          border: 1px dashed #afb5c4;
          border-radius: 12px;
          background: #ffffff;
          color: #273153;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .uploadButton:hover {
          border-color: #273153;
          background: #f9fafc;
        }

        .uploadButton input {
          display: none;
        }

        .actionRow {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }

        .actionRow button {
          min-height: 42px;
          padding: 0 14px;
          border-radius: 11px;
          border: none;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition:
            transform 0.16s ease,
            opacity 0.16s ease;
        }

        .actionRow button:hover:not(
            :disabled
          ) {
          transform: translateY(-1px);
        }

        .actionRow button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }

        .saveButton {
          flex: 1;
          background: #1b2447;
          color: #ffffff;
        }

        .cancelButton {
          background: #eceef3;
          color: #515970;
        }

        .removeButton {
          background: #fff0f0;
          color: #a3363d;
        }

        .helpBox {
          display: flex;
          gap: 14px;
          margin-top: 26px;
          padding: 18px 20px;
          border: 1px solid #e5e7ed;
          border-radius: 17px;
          background: #fbfbfc;
        }

        .helpIcon {
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #1b2447;
          color: #ffffff;
          font-size: 13px;
          font-weight: 900;
        }

        .helpBox strong {
          display: block;
          margin-bottom: 4px;
          color: #283153;
          font-size: 13px;
        }

        .helpBox p {
          max-width: 780px;
          margin: 0;
          color: #747b8e;
          font-size: 12px;
          line-height: 1.6;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (
          max-width: 1100px
        ) {
          .imageGrid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }
        }

        @media (
          max-width: 720px
        ) {
          .heroAdminPage {
            padding: 22px 15px 45px;
          }

          .heroAdminHeader {
            flex-direction: column;
            gap: 16px;
          }

          .imageGrid {
            grid-template-columns: 1fr;
          }

          .imageCard:hover {
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}