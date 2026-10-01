"use client";
import { useState, useRef } from "react";
import { ImagePlus, Plus, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  CoreSchema,
  review,
  type Recipe,
  type Core,
  type Ingredient,
} from "@/lib/model";
import { api } from "@/lib/client";
import { Picker, Field } from "./widgets";
type Lang = "de" | "en";
export default function RecipeEditor({
  initial,
  allTags,
  busy,
  lang,
  onSave,
  onClose,
}: {
  initial: Recipe;
  allTags: string[];
  busy: boolean;
  lang: Lang;
  onSave: (r: Recipe) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [warnings, setWarnings] = useState<string[] | null>(null);
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");
  const t = (de: string, en: string) => (lang === "de" ? de : en);
  const file = useRef<HTMLInputElement>(null);
  function set<K extends keyof Recipe>(key: K, value: Recipe[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setWarnings(null);
  }
  function ingredient(i: number, key: keyof Ingredient, value: unknown) {
    set(
      "ingredients",
      draft.ingredients.map((v, k) => (k === i ? { ...v, [key]: value } : v)),
    );
  }
  async function uploadPhoto(f: File) {
    setUploading(true);
    try {
      if (f.size > 10 * 1024 * 1024)
        throw new Error(t("Foto ist größer als 10 MB", "Photo exceeds 10 MB"));
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type))
        throw new Error(
          t("Bitte JPEG, PNG oder WebP verwenden.", "Use JPEG, PNG or WebP."),
        );
      const bitmap = await createImageBitmap(f);
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas
        .getContext("2d")!
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (v) => (v ? resolve(v) : reject(Error("Image conversion failed"))),
          "image/jpeg",
          0.82,
        ),
      );
      if (blob.size > 2 * 1024 * 1024)
        throw new Error("Photo still exceeds 2 MB");
      const result = await api("/api/images", {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });
      set("imageId", result.id!);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  async function save(force = false) {
    setError("");
    try {
      const {
        id: _,
        createdAt: __,
        history: ___,
        revisions: ____,
        ...data
      } = draft;
      CoreSchema.parse(data);
      if (checking && !force) {
        const issues = review(data);
        if (issues.length) {
          setWarnings(issues);
          return;
        }
      }
      await onSave(draft);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !uploading && !busy) onClose();
      }}
    >
      <DialogContent className="editor-dialog">
        <DialogTitle>{t("Rezept bearbeiten", "Edit recipe")}</DialogTitle>
        <DialogDescription>
          {t(
            "Deine Version zählt. Unbekannte Mengen und Zeiten dürfen leer bleiben.",
            "Make it yours. Unknown quantities and times can stay empty.",
          )}
        </DialogDescription>
        <div className="editor-scroll">
          <div className="editor-two">
            <Field label={t("Titel", "Title")}>
              <input
                value={draft.title}
                dir="auto"
                maxLength={180}
                onChange={(e) => set("title", e.target.value)}
              />
            </Field>
            <Field label={t("Rezeptsprache", "Recipe language")}>
              <Picker
                label="Recipe language"
                value={draft.language}
                onChange={(v) => set("language", v as Core["language"])}
                items={[
                  { value: "de", label: "Deutsch" },
                  { value: "en", label: "English" },
                  { value: "fa", label: "فارسی" },
                ]}
              />
            </Field>
          </div>
          <details className="editor-translations">
            <summary>{t("Übersetzte Titel", "Translated titles")}</summary>
            <div className="editor-two">
              {(["titleDe", "titleEn", "titleFa"] as const).map((k) => (
                <Field
                  key={k}
                  label={
                    k === "titleDe"
                      ? "Deutsch"
                      : k === "titleEn"
                        ? "English"
                        : "فارسی"
                  }
                >
                  <input
                    value={draft[k]}
                    dir="auto"
                    maxLength={180}
                    onChange={(e) => set(k, e.target.value)}
                  />
                </Field>
              ))}
            </div>
          </details>
          <Field label={t("Beschreibung", "Description")}>
            <textarea
              value={draft.description}
              dir="auto"
              maxLength={10000}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          <div className="editor-two">
            <Field label={t("Kategorie", "Category")}>
              <input
                value={draft.category}
                maxLength={80}
                placeholder="Dinner / Baking / Soup"
                onChange={(e) => set("category", e.target.value)}
              />
            </Field>
            <Field label={t("Küche / Nationalität", "Cuisine")}>
              <input
                value={draft.cuisine}
                maxLength={80}
                placeholder="Iranian / German / International"
                onChange={(e) => set("cuisine", e.target.value)}
              />
            </Field>
          </div>
          <div className="editor-numbers">
            <Field label={t("Anzahl", "Yield")}>
              <input
                type="number"
                min="0.5"
                max="10000"
                step="0.5"
                value={draft.yield}
                onChange={(e) => set("yield", Number(e.target.value))}
              />
            </Field>
            <Field label={t("Einheit", "Yield unit")}>
              <input
                value={draft.yieldUnit}
                maxLength={40}
                onChange={(e) => set("yieldUnit", e.target.value)}
              />
            </Field>
            {(["prep", "cook", "rest"] as const).map((k) => (
              <Field
                key={k}
                label={
                  k === "prep"
                    ? t("Vorbereitung (min)", "Prep (min)")
                    : k === "cook"
                      ? t("Garen (min)", "Cook (min)")
                      : t("Ruhe (min)", "Rest (min)")
                }
              >
                <input
                  type="number"
                  min="0"
                  max="10080"
                  value={draft[k] ?? ""}
                  placeholder="—"
                  onChange={(e) =>
                    set(
                      k,
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
              </Field>
            ))}
          </div>
          <div className="section-line">
            <h2>{t("Zutaten", "Ingredients")}</h2>
            <button
              className="secondary"
              onClick={() =>
                set("ingredients", [
                  ...draft.ingredients,
                  {
                    name: "",
                    quantity: null,
                    unit: "g",
                    optional: false,
                    note: "",
                  },
                ])
              }
            >
              <Plus size={16} />
              {t("Zutat", "Ingredient")}
            </button>
          </div>
          {draft.ingredients.map((i, k) => (
            <div className="ingredient-edit" key={k}>
              <input
                type="number"
                min="0"
                step="any"
                aria-label={t("Menge", "Amount")}
                placeholder="—"
                value={i.quantity ?? ""}
                onChange={(e) =>
                  ingredient(
                    k,
                    "quantity",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
              />
              <input
                aria-label={t("Einheit", "Unit")}
                placeholder="g / EL"
                maxLength={40}
                value={i.unit}
                onChange={(e) => ingredient(k, "unit", e.target.value)}
              />
              <input
                aria-label={t("Zutatenname", "Ingredient name")}
                dir="auto"
                placeholder={t("Zutat", "Ingredient")}
                maxLength={150}
                value={i.name}
                onChange={(e) => ingredient(k, "name", e.target.value)}
              />
              <button
                className="icon-button"
                aria-label={t("Zutat entfernen", "Remove ingredient")}
                onClick={() =>
                  set(
                    "ingredients",
                    draft.ingredients.filter((_, n) => n !== k),
                  )
                }
              >
                <X size={16} />
              </button>
              <input
                className="ingredient-note"
                dir="auto"
                value={i.note}
                maxLength={200}
                aria-label={t("Zutatennotiz", "Ingredient note")}
                placeholder={t(
                  "z. B. fein gehackt / Mengenbereich",
                  "e.g. finely chopped / quantity range",
                )}
                onChange={(e) => ingredient(k, "note", e.target.value)}
              />
              <label className="optional">
                <Checkbox
                  checked={i.optional}
                  onCheckedChange={(v) => ingredient(k, "optional", !!v)}
                />
                {t("Optional", "Optional")}
              </label>
            </div>
          ))}
          <div className="section-line">
            <h2>{t("Zubereitung", "Method")}</h2>
            <button
              className="secondary"
              onClick={() => set("steps", [...draft.steps, ""])}
            >
              <Plus size={16} />
              {t("Schritt", "Step")}
            </button>
          </div>
          {draft.steps.map((s, k) => (
            <div className="step-edit" key={k}>
              <span>{k + 1}</span>
              <textarea
                dir="auto"
                value={s}
                maxLength={4000}
                aria-label={`${t("Schritt", "Step")} ${k + 1}`}
                onChange={(e) =>
                  set(
                    "steps",
                    draft.steps.map((v, n) => (n === k ? e.target.value : v)),
                  )
                }
              />
              <button
                className="icon-button"
                aria-label={t("Schritt entfernen", "Remove step")}
                onClick={() =>
                  set(
                    "steps",
                    draft.steps.filter((_, n) => n !== k),
                  )
                }
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <h2>Tags</h2>
          <div className="chips">
            {[...new Set([...allTags, ...draft.tags])].map((tag) => (
              <button
                key={tag}
                className={`chip selectable ${draft.tags.includes(tag) ? "chosen" : ""}`}
                onClick={() =>
                  set(
                    "tags",
                    draft.tags.includes(tag)
                      ? draft.tags.filter((v) => v !== tag)
                      : [...draft.tags, tag],
                  )
                }
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="inline-form">
            <input
              maxLength={60}
              value={newTag}
              aria-label={t("Neuer Tag", "New tag")}
              placeholder={t("Neuer Tag …", "New tag …")}
              onChange={(e) => setNewTag(e.target.value)}
            />
            <button
              className="secondary"
              onClick={() => {
                const v = newTag.trim();
                if (v) {
                  set("tags", [...new Set([...draft.tags, v])]);
                  setNewTag("");
                }
              }}
            >
              <Plus size={16} />
              {t("Hinzufügen", "Add")}
            </button>
          </div>
          <Field
            label={t(
              "Persönliche Notizen / Aufbewahrung",
              "Personal notes / storage",
            )}
          >
            <textarea
              value={draft.notes}
              dir="auto"
              maxLength={10000}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
          <Field label={t("Quelle", "Source")}>
            <input
              value={draft.source}
              maxLength={2000}
              dir="auto"
              onChange={(e) => set("source", e.target.value)}
            />
          </Field>
          <Field label={t("Originaltext", "Original text")}>
            <textarea
              value={draft.sourceText}
              maxLength={30000}
              dir="auto"
              onChange={(e) => set("sourceText", e.target.value)}
            />
          </Field>
          <div className="photo-upload">
            {draft.imageId && (
              <img
                src={`/api/images/${draft.imageId}`}
                alt={t("Rezeptfoto", "Recipe photo")}
              />
            )}
            <button
              className="secondary"
              disabled={uploading}
              onClick={() => file.current?.click()}
            >
              <ImagePlus size={17} />
              {uploading
                ? t("Foto wird geladen …", "Uploading photo …")
                : t("Foto hinzufügen", "Add photo")}
            </button>
            {draft.imageId && (
              <button
                className="text-button"
                onClick={() => set("imageId", null)}
              >
                {t("Foto entfernen", "Remove photo")}
              </button>
            )}
            <input
              hidden
              ref={file}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files?.[0]) void uploadPhoto(e.target.files[0]);
                e.target.value = "";
              }}
            />
            <p className="small-text">
              {t(
                "JPEG, PNG oder WebP. Wird verkleinert; keine automatische Erkennung.",
                "JPEG, PNG or WebP. Resized on upload; no automatic recognition.",
              )}
            </p>
          </div>
          <label className="switch-label">
            <Switch
              checked={checking}
              onCheckedChange={(v) => {
                setChecking(v);
                setWarnings(null);
              }}
            />
            {t(
              "Vor dem Speichern auf Vollständigkeit prüfen",
              "Check completeness before saving",
            )}
          </label>
          <p className="small-text">
            {t(
              "Regelbasierter Check, keine AI-Bewertung der Mengenverhältnisse.",
              "Rule-based check, not an AI review of ingredient ratios.",
            )}
          </p>
          {warnings && (
            <div className="warning-box">
              <strong>{t("Bitte kurz prüfen", "Please review")}</strong>
              <ul>
                {warnings.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => void save(true)}
              >
                {t("So beibehalten & speichern", "Keep as is & save")}
              </button>
            </div>
          )}
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="editor-footer">
          <button
            className="secondary"
            disabled={busy || uploading}
            onClick={onClose}
          >
            {t("Abbrechen", "Cancel")}
          </button>
          <button
            className="primary"
            disabled={busy || uploading}
            onClick={() => void save()}
          >
            <Check size={17} />
            {busy
              ? t("Wird gespeichert …", "Saving …")
              : t("Rezept speichern", "Save recipe")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
