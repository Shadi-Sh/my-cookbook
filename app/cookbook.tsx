"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import RecipeEditor from "./recipe-editor";
import { Picker, Field } from "./widgets";
import { api } from "@/lib/client";
import {
  BookOpen,
  Heart,
  ShoppingBasket,
  Carrot,
  Tags,
  Plus,
  Search,
  Clock,
  Check,
  Download,
  Upload,
  ArrowLeft,
  ChefHat,
  NotebookPen,
  Trash2,
  Printer,
  Globe,
  RefreshCw,
  Copy,
  X,
  ImagePlus,
  ShieldCheck,
  Utensils,
  ChevronRight,
  History,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Toaster, toast } from "sonner";
import {
  CoreSchema,
  StateSchema,
  emptyState,
  newRecipe,
  demoRecipes,
  normalize,
  matches,
  missing,
  shoppingFor,
  total,
  review,
  extractionPrompt,
  type State,
  type Recipe,
  type Core,
  type Ingredient,
} from "@/lib/model";
type Page =
  | "recipes"
  | "favourites"
  | "pantry"
  | "shopping"
  | "tags"
  | "settings";
type Lang = "de" | "en";
const fmt = (n: number | null) =>
  n === null
    ? "—"
    : new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
const photo = (r: Recipe) =>
  r.imageId
    ? `/api/images/${r.imageId}`
    : r.demo && r.category === "Baking"
      ? "/images/cookies.png"
      : null;
export default function Cookbook() {
  const [lang, setLang] = useState<Lang>("de");
  const t = (de: string, en: string) => (lang === "de" ? de : en);
  const [state, setState] = useState<State>(emptyState);
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [page, setPage] = useState<Page>("recipes");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [cuisine, setCuisine] = useState("all");
  const [tag, setTag] = useState("all");
  const [status, setStatus] = useState("all");
  const [time, setTime] = useState("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editor, setEditor] = useState<Recipe | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [importError, setImportError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [restoreData, setRestoreData] = useState<{
    state: State;
    images: Record<string, { mime: string; data: string }>;
  } | null>(null);
  const [pantryInput, setPantryInput] = useState("");
  const [maxMissing, setMaxMissing] = useState("all");
  const [tagInput, setTagInput] = useState("");
  const [rename, setRename] = useState<Record<string, string>>({});
  const [aliasName, setAliasName] = useState("");
  const [aliasValues, setAliasValues] = useState("");
  const [cookNote, setCookNote] = useState("");
  const [portions, setPortions] = useState(2);
  const [cooking, setCooking] = useState(false);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [excludePantry, setExcludePantry] = useState(true);
  const restoreInput = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setFailure("");
    try {
      const result = await api("/api/state");
      setState(StateSchema.parse(result.state));
      setVersion(result.version!);
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const saved = localStorage.getItem("cookbook-language");
    if (saved === "de" || saved === "en") setLang(saved);
  }, [load]);
  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem("cookbook-language", lang);
  }, [lang]);
  async function commit(next: State) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    try {
      const valid = StateSchema.parse(next);
      const result = await api("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: valid, version }),
      });
      setState(valid);
      setVersion(result.version!);
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  const active = state.recipes.find((r) => r.id === detailId);
  const tags = [
    ...new Set([...state.tags, ...state.recipes.flatMap((r) => r.tags)]),
  ].sort();
  const categories = [
    ...new Set(state.recipes.map((r) => r.category).filter(Boolean)),
  ].sort();
  const cuisines = [
    ...new Set(state.recipes.map((r) => r.cuisine).filter(Boolean)),
  ].sort();
  const visible = state.recipes
    .filter(
      (r) =>
        matches(r, query, state.aliases) &&
        (page !== "favourites" || r.favourite) &&
        (category === "all" || r.category === category) &&
        (cuisine === "all" || r.cuisine === cuisine) &&
        (tag === "all" || r.tags.includes(tag)) &&
        (status === "all" ||
          (status === "cooked" && r.cooked) ||
          (status === "new" && !r.cooked)) &&
        (time === "all" || (total(r) !== null && total(r)! <= Number(time))),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  function openRecipe(r: Recipe) {
    setDetailId(r.id);
    setPortions(r.yield);
    setCooking(false);
    setStep(0);
    setCookNote("");
  }
  function create() {
    setEditor(
      {...newRecipe({
        title: t("Neues Rezept", "New recipe"),
        language: lang,
        yieldUnit: t("Portionen", "portions"),
      }), title: ""},
    );
  }
  function edit(r: Recipe) {
    setEditor(structuredClone(r));
  }
  async function saveRecipe(r: Recipe) {
    const previous = state.recipes.find((v) => v.id === r.id);
    const {
      id: _id,
      createdAt: _date,
      history: _h,
      revisions: _v,
      ...core
    } = previous ?? r;
    const saved = {
      ...r,
      revisions: previous
        ? [
            ...previous.revisions,
            { date: new Date().toISOString(), data: CoreSchema.parse(core) },
          ].slice(-30)
        : r.revisions,
    };
    const next = {
      ...state,
      recipes: previous
        ? state.recipes.map((v) => (v.id === r.id ? saved : v))
        : [saved, ...state.recipes],
      tags: [...new Set([...state.tags, ...r.tags])],
    };
    if (await commit(next)) {
      setEditor(null);
      openRecipe(saved);
      toast.success(t("Rezept gespeichert", "Recipe saved"));
    }
  }
  async function toggle(r: Recipe, key: "favourite" | "cooked") {
    await commit({
      ...state,
      recipes: state.recipes.map((v) =>
        v.id === r.id ? { ...v, [key]: !v[key] } : v,
      ),
    });
  }
  function importDraft() {
    try {
      const clean = raw
        .trim()
        .replace(/^```(?:json)?\s*/, "")
        .replace(/\s*```$/, "");
      const input = JSON.parse(clean);
      const recipe = newRecipe(input);
      if (!recipe.sourceText) recipe.sourceText = clean;
      recipe.originalImport = clean;
      setEditor(recipe);
      setImportOpen(false);
      setRaw("");
      setImportError("");
    } catch (e) {
      setImportError(
        t(
          "Kein gültiger Entwurf. Verwende das kopierte Prompt und das JSON-Format.",
          "Invalid draft. Use the copied prompt and JSON format.",
        ) +
          " " +
          (e instanceof Error ? e.message.slice(0, 220) : ""),
      );
    }
  }
  async function examples() {
    if (
      await commit({
        ...state,
        recipes: [...state.recipes, ...demoRecipes()],
        tags: [
          ...new Set([
            ...state.tags,
            "Baking",
            "To try",
            "Autumn",
            "Vegetarian",
          ]),
        ],
      })
    )
      toast.success(t("Beispiele hinzugefügt", "Examples added"));
  }
  async function makeShopping() {
    const entries = state.recipes
      .filter((r) => selected[r.id])
      .map((recipe) => ({ recipe, yield: selected[recipe.id] }));
    if (!entries.length) {
      toast.error(
        t("Wähle mindestens ein Rezept.", "Choose at least one recipe."),
      );
      return;
    }
    const shopping = shoppingFor(
      entries,
      state.pantry,
      excludePantry,
      state.aliases,
    );
    if (await commit({ ...state, shopping }))
      toast.success(t("Einkaufsliste erstellt", "Shopping list created"));
  }
  async function exportBackup() {
    if (lock.current) return;
    setBusy(true);
    try {
      const ids = [
        ...new Set(
          state.recipes
            .flatMap((r) => [
              r.imageId,
              ...r.revisions.map((v) => v.data.imageId),
            ])
            .filter((id): id is string => !!id),
        ),
      ];
      const images: Record<string, { mime: string; data: string }> = {};
      let size = 0;
      for (const id of ids) {
        const res = await fetch(`/api/images/${id}`);
        if (!res.ok)
          throw new Error(
            t(
              "Ein Foto konnte nicht exportiert werden.",
              "Could not export a photo.",
            ),
          );
        const blob = await res.blob();
        size += blob.size;
        if (size > 14 * 1024 * 1024)
          throw new Error(
            t(
              "Fotos überschreiten die Backup-Grenze von 14 MB. Export wurde abgebrochen.",
              "Photos exceed the 14 MB backup limit. Export cancelled.",
            ),
          );
        const data = await new Promise<string>((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result).split(",")[1]);
          fr.onerror = reject;
          fr.readAsDataURL(blob);
        });
        images[id] = { mime: blob.type, data };
      }
      download(
        JSON.stringify(
          {
            schemaVersion: 1,
            exportedAt: new Date().toISOString(),
            state,
            images,
          },
          null,
          2,
        ),
        "my-cookbook-backup.json",
        "application/json",
      );
      toast.success(t("Backup heruntergeladen", "Backup downloaded"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function parseRestore(file: File) {
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error("Backup exceeds 20 MB");
      const data = JSON.parse(await file.text());
      if (data.schemaVersion !== 1)
        throw new Error("Unsupported backup version");
      const restored = StateSchema.parse(data.state);
      const images = data.images ?? {};
      if (
        typeof images !== "object" ||
        Array.isArray(images) ||
        Object.keys(images).length > 600
      )
        throw new Error("Invalid images");
      const required = [
        ...new Set(
          restored.recipes
            .flatMap((r) => [
              r.imageId,
              ...r.revisions.map((v) => v.data.imageId),
            ])
            .filter(Boolean),
        ),
      ];
      for (const id of required) {
        const v = images[id as string];
        if (
          !v ||
          !["image/jpeg", "image/png", "image/webp"].includes(v.mime) ||
          typeof v.data !== "string" ||
          v.data.length > 3e6 ||
          !/^[A-Za-z0-9+/]*={0,2}$/.test(v.data)
        )
          throw new Error("Invalid or missing backup image");
      }
      setRestoreData({ state: restored, images });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function restore() {
    if (!restoreData) return;
    const data = restoreData;
    setRestoreData(null);
    setBusy(true);
    try {
      const map: Record<string, string> = {};
      for (const old of [
        ...new Set(
          data.state.recipes
            .flatMap((r) => [
              r.imageId,
              ...r.revisions.map((v) => v.data.imageId),
            ])
            .filter((id): id is string => !!id),
        ),
      ]) {
        const im = data.images[old];
        const bytes = Uint8Array.from(atob(im.data), (c) => c.charCodeAt(0));
        const result = await api("/api/images", {
          method: "POST",
          headers: { "Content-Type": im.mime },
          body: bytes,
        });
        map[old] = result.id!;
      }
      const next = {
        ...data.state,
        recipes: data.state.recipes.map((r) => ({
          ...r,
          imageId: r.imageId ? map[r.imageId] : null,
          revisions: r.revisions.map((v) => ({
            ...v,
            data: {
              ...v.data,
              imageId: v.data.imageId ? map[v.data.imageId] : null,
            },
          })),
        })),
      };
      if (await commit(next)) {
        setDetailId(null);
        setPage("recipes");
        toast.success(t("Backup wiederhergestellt", "Backup restored"));
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    const context = (
      document as unknown as {
        modelContext?: {
          registerTool: (tool: unknown, options: unknown) => Promise<void>;
        };
      }
    ).modelContext;
    if (!context) return;
    const controller = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: "search_saved_recipes",
          title: "Search saved recipes",
          description:
            "Search only the current user’s saved recipes and update the library search. Does not change saved data.",
          inputSchema: {
            type: "object",
            properties: { query: { type: "string", maxLength: 200 } },
            required: ["query"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: (input: unknown) => {
            const v = input as { query?: unknown };
            if (
              !v ||
              typeof v.query !== "string" ||
              v.query.length > 200 ||
              Object.keys(v).some((k) => k !== "query")
            )
              throw new Error("Invalid query");
            setQuery(v.query);
            setCategory("all");
            setCuisine("all");
            setTag("all");
            setStatus("all");
            setTime("all");
            setPage("recipes");
            setDetailId(null);
            return state.recipes
              .filter((r) => matches(r, v.query as string, state.aliases))
              .map((r) => ({ id: r.id, title: r.title }));
          },
        },
        { signal: controller.signal },
      ),
    ).catch(() => {});
    return () => controller.abort();
  }, [state]);
  const nav = [
    { id: "recipes", icon: BookOpen, label: t("Alle Rezepte", "All recipes") },
    {
      id: "favourites",
      icon: Heart,
      label: t("Lieblingsrezepte", "Favourites"),
    },
    { id: "pantry", icon: Carrot, label: t("Mein Vorrat", "My pantry") },
    {
      id: "shopping",
      icon: ShoppingBasket,
      label: t("Einkaufsliste", "Shopping list"),
    },
    {
      id: "tags",
      icon: Tags,
      label: t("Tags & Zutaten", "Tags & ingredients"),
    },
  ];
  const navigate = (p: Page) => {
    setPage(p);
    setDetailId(null);
  };
  return (
    <SidebarProvider>
      <Sidebar className="cook-sidebar">
        <SidebarHeader>
          <button className="brand" onClick={() => navigate("recipes")}>
            <span className="brand-mark">
              <BookOpen size={24} />
            </span>
            <span>
              My
              <br />
              Cookbook
              <span className="brand-small">YOUR PERSONAL RECIPE BOOK</span>
            </span>
          </button>
        </SidebarHeader>
        <SidebarContent>
          <div className="nav-label">{t("DEINE KÜCHE", "YOUR KITCHEN")}</div>
          <SidebarMenu>
            {nav.map((n) => (
              <SidebarMenuItem key={n.id}>
                <SidebarMenuButton
                  isActive={page === n.id}
                  onClick={() => navigate(n.id as Page)}
                >
                  <n.icon />
                  <span>{n.label}</span>
                  {n.id === "recipes" && (
                    <span className="nav-count">{state.recipes.length}</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <div className="sidebar-note">
            <NotebookPen size={21} />
            <p>
              {t(
                "Deine Rezepte. Deine kleinen Verbesserungen.",
                "Your recipes. Your little improvements.",
              )}
            </p>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenuButton
            onClick={() => navigate("settings")}
            isActive={page === "settings"}
          >
            <ShieldCheck />
            <span>{t("Daten & Sicherung", "Data & backup")}</span>
          </SidebarMenuButton>
          <div className="private-label">
            <ShieldCheck size={14} />
            {t("Privates Kochbuch", "Private cookbook")}
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="topbar">
          <div className="mobile-menu">
            <SidebarTrigger />
          </div>
          <div className="breadcrumb">
            {t("Mein Kochbuch", "My Cookbook")}
            <ChevronRight size={14} />
            <span>
              {active
                ? active.title
                : (nav.find((n) => n.id === page)?.label ??
                  t("Daten & Sicherung", "Data & backup"))}
            </span>
          </div>
          <div className="top-actions">
            <button
              className="icon-button"
              onClick={() => void load()}
              disabled={busy}
              aria-label={t("Neu laden", "Reload")}
            >
              <RefreshCw size={17} />
            </button>
            <div className="language">
              <Globe size={15} />
              <button
                aria-pressed={lang === "de"}
                className={lang === "de" ? "active" : ""}
                onClick={() => setLang("de")}
              >
                DE
              </button>
              <button
                aria-pressed={lang === "en"}
                className={lang === "en" ? "active" : ""}
                onClick={() => setLang("en")}
              >
                EN
              </button>
            </div>
            <span className="avatar">S</span>
          </div>
        </header>
        <main className="workspace">
          {loading ? (
            <div className="status-panel">
              {t("Dein Kochbuch wird geladen …", "Loading your cookbook …")}
            </div>
          ) : failure ? (
            <div className="status-panel error">
              <h2>
                {t(
                  "Dein Kochbuch ist gerade nicht erreichbar",
                  "Your cookbook is currently unavailable",
                )}
              </h2>
              <p>{failure}</p>
              <button className="primary" onClick={() => void load()}>
                {t("Erneut versuchen", "Try again")}
              </button>
            </div>
          ) : active ? (
            <>
              <button className="back" onClick={() => setDetailId(null)}>
                <ArrowLeft size={17} />
                {t("Zurück zu den Rezepten", "Back to recipes")}
              </button>
              <div className="detail-heading">
                <div>
                  <p className="eyebrow">
                    {active.category || t("REZEPT", "RECIPE")}
                    {active.demo ? " · DEMO" : ""}
                  </p>
                  <h1 dir="auto">{active.title}</h1>
                  {active.titleFa && active.title !== active.titleFa && (
                    <p className="translated" dir="auto">
                      {active.titleFa}
                    </p>
                  )}
                </div>
                <div className="button-row">
                  <button className="secondary" onClick={() => edit(active)}>
                    <NotebookPen size={16} />
                    {t("Bearbeiten", "Edit")}
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => void toggle(active, "favourite")}
                    aria-label={t("Favorit umschalten", "Toggle favourite")}
                  >
                    <Heart
                      fill={active.favourite ? "currentColor" : "none"}
                      size={20}
                    />
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => window.print()}
                    aria-label="PDF"
                  >
                    <Printer size={20} />
                  </button>
                </div>
              </div>
              <div className="detail-grid">
                <section>
                  <div className="detail-photo">
                    {photo(active) ? (
                      <img src={photo(active)!} alt={active.title} />
                    ) : (
                      <div className="photo-empty">
                        <Utensils size={42} />
                      </div>
                    )}
                    {active.demo && photo(active) && (
                      <span>
                        {t(
                          "Beispielbild · AI-generiert",
                          "Example image · AI generated",
                        )}
                      </span>
                    )}
                  </div>
                  <div className="recipe-meta">
                    <span>
                      <Clock size={17} />
                      {total(active) === null
                        ? t("Zeit unbekannt", "Time unknown")
                        : `${total(active)} min`}
                    </span>
                    <span>{active.cuisine || "—"}</span>
                    <label>
                      <Checkbox
                        checked={active.cooked}
                        disabled={busy}
                        onCheckedChange={() => void toggle(active, "cooked")}
                      />
                      {t("Schon gekocht", "Cooked before")}
                    </label>
                  </div>
                  <p className="description" dir="auto">
                    {active.description}
                  </p>
                  <div className="chips">
                    {active.tags.map((v) => (
                      <span className="chip" key={v}>
                        {v}
                      </span>
                    ))}
                  </div>
                  <section className="steps-section">
                    <div className="section-line">
                      <h2>{t("Zubereitung", "Method")}</h2>
                      <button
                        className="secondary"
                        onClick={() => {
                          setCooking(!cooking);
                          setStep(0);
                        }}
                      >
                        <ChefHat size={16} />
                        {cooking
                          ? t("Alle Schritte", "All steps")
                          : t("Kochmodus", "Cook mode")}
                      </button>
                    </div>
                    {!active.steps.length && (
                      <p>
                        {t("Noch keine Schritte eingetragen.", "No steps yet.")}
                      </p>
                    )}
                    {active.steps.map(
                      (s, i) =>
                        (!cooking || i === step) && (
                          <div
                            className={`method-step ${cooking ? "cook-mode" : ""}`}
                            key={i}
                          >
                            <span>{String(i + 1).padStart(2, "0")}</span>
                            <p dir="auto">{s}</p>
                          </div>
                        ),
                    )}
                    {cooking && (
                      <div className="button-row">
                        <button
                          className="secondary"
                          disabled={step === 0}
                          onClick={() => setStep(step - 1)}
                        >
                          {t("Zurück", "Previous")}
                        </button>
                        <span>
                          {step + 1} / {active.steps.length}
                        </span>
                        <button
                          className="primary"
                          disabled={step >= active.steps.length - 1}
                          onClick={() => setStep(step + 1)}
                        >
                          {t("Weiter", "Next")}
                        </button>
                      </div>
                    )}
                  </section>
                  <section className="notes-section">
                    <h2>{t("Meine Notizen", "My notes")}</h2>
                    <p dir="auto" className="preserve">
                      {active.notes ||
                        t(
                          "Platz für deine nächste kleine Verbesserung.",
                          "Room for your next little improvement.",
                        )}
                    </p>
                    <Field
                      label={t("Wie ist es geworden?", "How did it turn out?")}
                    >
                      <textarea
                        value={cookNote}
                        onChange={(e) => setCookNote(e.target.value)}
                        maxLength={2000}
                        placeholder={t(
                          "Weniger Zucker? Fünf Minuten länger im Ofen?",
                          "Less sugar? Five more minutes in the oven?",
                        )}
                      />
                    </Field>
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={async () => {
                        const r = {
                          ...active,
                          cooked: true,
                          history: [
                            ...active.history,
                            { date: new Date().toISOString(), note: cookNote },
                          ],
                        };
                        if (
                          await commit({
                            ...state,
                            recipes: state.recipes.map((v) =>
                              v.id === r.id ? r : v,
                            ),
                          })
                        ) {
                          setCookNote("");
                          toast.success(
                            t("Kocherlebnis gespeichert", "Cooking recorded"),
                          );
                        }
                      }}
                    >
                      <Check size={16} />
                      {t("Heute gekocht", "Cooked today")}
                    </button>
                    {active.history
                      .slice()
                      .reverse()
                      .map((h, i) => (
                        <p key={i} className="history-line">
                          <History size={15} />
                          {new Date(h.date).toLocaleDateString(
                            lang === "de" ? "de-DE" : "en-GB",
                          )}{" "}
                          — <span dir="auto">{h.note}</span>
                        </p>
                      ))}
                  </section>
                </section>
                <aside className="ingredient-panel">
                  <div className="section-line">
                    <h2>{t("Zutaten", "Ingredients")}</h2>
                    <span>{active.ingredients.length}</span>
                  </div>
                  <div className="portion-control">
                    <button
                      aria-label={t("Weniger Portionen", "Fewer servings")}
                      onClick={() => setPortions(Math.max(0.5, portions - 0.5))}
                    >
                      −
                    </button>
                    <span>
                      {fmt(portions)} {active.yieldUnit}
                    </span>
                    <button
                      aria-label={t("Mehr Portionen", "More servings")}
                      onClick={() => setPortions(portions + 0.5)}
                    >
                      +
                    </button>
                  </div>
                  <p className="small-text">
                    {t(
                      "Mengen skalieren; Garzeit bleibt unverändert.",
                      "Amounts scale; cooking time stays unchanged.",
                    )}
                  </p>
                  <ul className="ingredients">
                    {active.ingredients.map((i, k) => (
                      <li key={k}>
                        <div>
                          <strong>
                            {i.quantity === null
                              ? i.unit || t("nach Geschmack", "to taste")
                              : `${fmt((i.quantity * portions) / active.yield)} ${i.unit}`}
                          </strong>
                          <span dir="auto">{i.name}</span>
                        </div>
                        {i.optional && (
                          <small>{t("optional", "optional")}</small>
                        )}
                        {i.note && <small dir="auto">{i.note}</small>}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="primary full"
                    disabled={busy}
                    onClick={async () => {
                      const shopping = shoppingFor(
                        [{ recipe: active, yield: portions }],
                        state.pantry,
                        false,
                        state.aliases,
                      );
                      if (await commit({ ...state, shopping })) {
                        navigate("shopping");
                        setSelected({ [active.id]: portions });
                      }
                    }}
                  >
                    <ShoppingBasket size={17} />
                    {t("Einkaufsliste erstellen", "Create shopping list")}
                  </button>
                  {active.source && (
                    <div className="source">
                      <h3>{t("Quelle", "Source")}</h3>
                      <p dir="auto">{active.source}</p>
                    </div>
                  )}
                  {active.revisions.length > 0 && (
                    <details className="revisions">
                      <summary>
                        {active.revisions.length}{" "}
                        {t("frühere Versionen", "previous versions")}
                      </summary>
                      {active.revisions.map((v, i) => (
                        <div key={i}>
                          <span>{new Date(v.date).toLocaleString()}</span>
                          <button
                            className="text-button"
                            onClick={() =>
                              setEditor({
                                ...active,
                                ...structuredClone(v.data),
                              })
                            }
                          >
                            {t("Als Entwurf öffnen", "Open as draft")}
                          </button>
                        </div>
                      ))}
                    </details>
                  )}
                  {active.originalImport && (
                    <details className="revisions">
                      <summary>
                        {t("Unveränderter Import", "Unchanged import")}
                      </summary>
                      <p dir="auto" className="preserve">
                        {active.originalImport}
                      </p>
                    </details>
                  )}
                  {active.sourceText && (
                    <details className="revisions">
                      <summary>
                        {t("Original ansehen", "View original")}
                      </summary>
                      <p dir="auto" className="preserve">
                        {active.sourceText}
                      </p>
                    </details>
                  )}
                  <button
                    className="danger-text"
                    onClick={() => setDeleteId(active.id)}
                  >
                    <Trash2 size={15} />
                    {t("Rezept löschen", "Delete recipe")}
                  </button>
                </aside>
              </div>
            </>
          ) : page === "recipes" || page === "favourites" ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">
                    {t(
                      "SAMMELN. KOCHEN. VERFEINERN.",
                      "COLLECT. COOK. MAKE IT YOURS.",
                    )}
                  </p>
                  <h1>
                    {page === "favourites"
                      ? t("Deine Lieblingsrezepte", "Your favourites")
                      : t("Deine Rezeptsammlung", "Your recipe collection")}
                  </h1>
                  <p>
                    {t(
                      "Alles, was du gerne kochst. An einem Ort.",
                      "Everything you love to cook. In one place.",
                    )}
                  </p>
                </div>
                <div className="button-row">
                  <button
                    className="secondary"
                    onClick={() => {
                      setImportOpen(true);
                      setImportError("");
                    }}
                  >
                    <Upload size={17} />
                    {t("Importieren", "Import")}
                  </button>
                  <button className="primary" onClick={create}>
                    <Plus size={18} />
                    {t("Neues Rezept", "New recipe")}
                  </button>
                </div>
              </div>
              <div className="library-tools">
                <div className="search">
                  <Search size={19} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    maxLength={200}
                    placeholder={t(
                      "Rezepte, Zutaten oder Tags suchen …",
                      "Search recipes, ingredients or tags …",
                    )}
                    aria-label={t("Rezepte suchen", "Search recipes")}
                  />
                  {query && (
                    <button
                      aria-label={t("Suche leeren", "Clear search")}
                      onClick={() => setQuery("")}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div className="filter-row">
                  <Picker
                    label="Category"
                    value={category}
                    onChange={setCategory}
                    items={[
                      {
                        value: "all",
                        label: t("Alle Kategorien", "All categories"),
                      },
                      ...categories.map((v) => ({ value: v, label: v })),
                    ]}
                  />
                  <Picker
                    label="Cuisine"
                    value={cuisine}
                    onChange={setCuisine}
                    items={[
                      { value: "all", label: t("Alle Küchen", "All cuisines") },
                      ...cuisines.map((v) => ({ value: v, label: v })),
                    ]}
                  />
                  <Picker
                    label="Tags"
                    value={tag}
                    onChange={setTag}
                    items={[
                      { value: "all", label: t("Alle Tags", "All tags") },
                      ...tags.map((v) => ({ value: v, label: v })),
                    ]}
                  />
                  <Picker
                    label="Status"
                    value={status}
                    onChange={setStatus}
                    items={[
                      { value: "all", label: t("Jeder Status", "Any status") },
                      { value: "cooked", label: t("Schon gekocht", "Cooked") },
                      {
                        value: "new",
                        label: t("Noch nicht gekocht", "Not cooked yet"),
                      },
                    ]}
                  />
                  <Picker
                    label="Time"
                    value={time}
                    onChange={setTime}
                    items={[
                      { value: "all", label: t("Jede Dauer", "Any duration") },
                      { value: "30", label: "≤ 30 min" },
                      { value: "60", label: "≤ 60 min" },
                    ]}
                  />
                </div>
              </div>
              <div className="results-line">
                <span>
                  {visible.length} {t("Rezepte", "recipes")}
                </span>
                <span>
                  {t("Deutsch · English · فارسی", "Deutsch · English · فارسی")}
                </span>
              </div>
              {visible.length ? (
                <div className="recipe-grid">
                  {visible.map((r) => (
                    <article className="recipe-card" key={r.id}>
                      <button
                        className="card-image"
                        onClick={() => openRecipe(r)}
                        aria-label={r.title}
                      >
                        {photo(r) ? (
                          <img src={photo(r)!} alt={r.title} />
                        ) : (
                          <div className="card-no-image">
                            <Utensils size={34} />
                            <span>{r.category || t("Rezept", "Recipe")}</span>
                          </div>
                        )}
                        {r.demo && (
                          <span className="demo-label">
                            {t("Beispiel", "Example")}
                          </span>
                        )}
                        {r.cooked && (
                          <span className="cooked-badge">
                            <Check size={14} />
                            {t("Gekocht", "Cooked")}
                          </span>
                        )}
                      </button>
                      <button
                        className={`card-heart ${r.favourite ? "liked" : ""}`}
                        aria-label={t("Favorit umschalten", "Toggle favourite")}
                        disabled={busy}
                        onClick={() => void toggle(r, "favourite")}
                      >
                        <Heart
                          size={19}
                          fill={r.favourite ? "currentColor" : "none"}
                        />
                      </button>
                      <div className="card-body">
                        <p className="card-category">
                          {r.category || t("Rezept", "Recipe")}
                          {r.cuisine ? " · " + r.cuisine : ""}
                        </p>
                        <button
                          className="card-title"
                          onClick={() => openRecipe(r)}
                          dir="auto"
                        >
                          {r.title}
                        </button>
                        <div className="card-meta">
                          <span>
                            <Clock size={14} />
                            {total(r) === null
                              ? t("Zeit offen", "Time unknown")
                              : `${total(r)} min`}
                          </span>
                          <span>
                            {fmt(r.yield)} {r.yieldUnit}
                          </span>
                        </div>
                        <div className="chips">
                          {r.tags.slice(0, 3).map((v) => (
                            <span className="chip" key={v}>
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-library">
                  <div>
                    <span className="empty-icon">
                      <BookOpen size={28} />
                    </span>
                    <h2>
                      {state.recipes.length
                        ? t("Kein passendes Rezept", "No matching recipes")
                        : t(
                            "Dein erstes Rezept wartet",
                            "Your first recipe is waiting",
                          )}
                    </h2>
                    <p>
                      {state.recipes.length
                        ? t(
                            "Probiere andere Suchbegriffe oder Filter.",
                            "Try different search terms or filters.",
                          )
                        : t(
                            "Trage ein Lieblingsrezept ein oder importiere einen vorbereiteten Entwurf.",
                            "Add a favourite recipe or import a prepared draft.",
                          )}
                    </p>
                    <button className="primary" onClick={create}>
                      <Plus size={17} />
                      {t("Rezept hinzufügen", "Add a recipe")}
                    </button>
                    {!state.recipes.length && (
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() => void examples()}
                      >
                        {t(
                          "Mit zwei Beispielrezepten ausprobieren",
                          "Try with two example recipes",
                        )}
                      </button>
                    )}
                  </div>
                  <div className="empty-photo">
                    <img
                      src="/images/cookies.png"
                      alt={t(
                        "Beispielbild von Mandel-Kokos-Cookies",
                        "Example almond coconut cookie photo",
                      )}
                    />
                    <span>
                      {t(
                        "Beispielbild · AI-generiert",
                        "Example image · AI generated",
                      )}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : page === "pantry" ? (
            <>
              <Heading
                eyebrow={t("WAS IST SCHON DA?", "WHAT’S ALREADY AT HOME?")}
                title={t("Mein Vorrat", "My pantry")}
                subtitle={t(
                  "Finde Rezepte mit den Zutaten, die du bereits hast.",
                  "Find recipes with ingredients you already have.",
                )}
              />
              <div className="two-columns">
                <section className="panel">
                  <h2>{t("Zutaten zu Hause", "Ingredients at home")}</h2>
                  <p className="small-text">
                    {t(
                      "Eingabe auf Deutsch, Englisch oder فارسی.",
                      "Enter names in German, English or فارسی.",
                    )}
                  </p>
                  <form
                    className="inline-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const value = pantryInput.trim();
                      if (
                        !value ||
                        state.pantry.some(
                          (v) => normalize(v) === normalize(value),
                        )
                      )
                        return;
                      if (
                        await commit({
                          ...state,
                          pantry: [...state.pantry, value],
                        })
                      )
                        setPantryInput("");
                    }}
                  >
                    <input
                      value={pantryInput}
                      maxLength={150}
                      onChange={(e) => setPantryInput(e.target.value)}
                      dir="auto"
                      aria-label={t("Zutat", "Ingredient")}
                      placeholder="Kartoffeln / potatoes / سیب‌زمینی"
                    />
                    <button
                      className="primary"
                      disabled={busy}
                      aria-label={t("Hinzufügen", "Add")}
                    >
                      <Plus size={18} />
                    </button>
                  </form>
                  <div className="pantry-chips">
                    {state.pantry.map((p) => (
                      <span className="pantry-chip" key={p}>
                        <span dir="auto">{p}</span>
                        <button
                          aria-label={`${p} ${t("entfernen", "remove")}`}
                          disabled={busy}
                          onClick={() =>
                            void commit({
                              ...state,
                              pantry: state.pantry.filter((v) => v !== p),
                            })
                          }
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="small-text">
                    {t(
                      "Wir prüfen, ob eine Zutat vorhanden ist, nicht ob die Menge reicht. Optionale Zutaten zählen nicht als fehlend.",
                      "Matches check ingredient presence, not whether you have enough. Optional ingredients do not count as missing.",
                    )}
                  </p>
                </section>
                <section className="panel">
                  <div className="section-line">
                    <h2>{t("Das kannst du kochen", "What you can cook")}</h2>
                    <Picker
                      label="Missing ingredients"
                      value={maxMissing}
                      onChange={setMaxMissing}
                      items={[
                        { value: "all", label: t("Alle anzeigen", "Show all") },
                        { value: "0", label: t("Alles da", "Nothing missing") },
                        {
                          value: "1",
                          label: t("Max. 1 fehlt", "Max. 1 missing"),
                        },
                        {
                          value: "2",
                          label: t("Max. 2 fehlen", "Max. 2 missing"),
                        },
                      ]}
                    />
                  </div>
                  {state.recipes
                    .map((r) => ({
                      r,
                      m: missing(r, state.pantry, state.aliases),
                    }))
                    .sort((a, b) => a.m.length - b.m.length)
                    .filter(
                      (v) =>
                        maxMissing === "all" ||
                        v.m.length <= Number(maxMissing),
                    )
                    .map(({ r, m }) => (
                      <button
                        className="match-row"
                        key={r.id}
                        onClick={() => openRecipe(r)}
                      >
                        <div>
                          <strong dir="auto">{r.title}</strong>
                          <p>
                            {m.length
                              ? t("Fehlt: ", "Missing: ") + m.join(", ")
                              : t(
                                  "Alle benötigten Zutaten vorhanden",
                                  "All required ingredients available",
                                )}
                          </p>
                        </div>
                        <span
                          className={m.length ? "missing-count" : "match-ready"}
                        >
                          {m.length || <Check size={16} />}
                        </span>
                      </button>
                    ))}
                  {!state.recipes.length && (
                    <p>
                      {t(
                        "Speichere zuerst ein Rezept.",
                        "Save a recipe first.",
                      )}
                    </p>
                  )}
                </section>
              </div>
            </>
          ) : page === "shopping" ? (
            <>
              <Heading
                eyebrow={t("FÜR DEN NÄCHSTEN EINKAUF", "FOR YOUR NEXT SHOP")}
                title={t("Meine Einkaufsliste", "My shopping list")}
                subtitle={t(
                  "Mehrere Rezepte. Eine Liste. Gemeinsam benötigte Zutaten werden zusammengezählt.",
                  "Multiple recipes. One list. Shared ingredients are added together.",
                )}
              />
              <div className="two-columns">
                <section className="panel">
                  <h2>{t("Rezepte auswählen", "Choose recipes")}</h2>
                  {state.recipes.map((r) => (
                    <div className="shopping-select" key={r.id}>
                      <Checkbox
                        checked={!!selected[r.id]}
                        onCheckedChange={(v) =>
                          setSelected((s) => {
                            const next = { ...s };
                            if (v) next[r.id] = r.yield;
                            else delete next[r.id];
                            return next;
                          })
                        }
                      />
                      <span dir="auto">{r.title}</span>
                      {selected[r.id] && (
                        <input
                          type="number"
                          min="0.5"
                          max="10000"
                          step="0.5"
                          aria-label={`${r.title} servings`}
                          value={selected[r.id]}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              [r.id]: Math.max(0.5, Number(e.target.value)),
                            })
                          }
                        />
                      )}
                    </div>
                  ))}
                  <label className="switch-label">
                    <Switch
                      checked={excludePantry}
                      onCheckedChange={setExcludePantry}
                    />
                    {t(
                      "Vorhandene Zutaten auslassen",
                      "Skip ingredients in pantry",
                    )}
                  </label>
                  <p className="small-text">
                    {t(
                      "Die neue Liste ersetzt die bestehende. Optionale Zutaten werden ausgelassen.",
                      "The new list replaces the existing list. Optional ingredients are omitted.",
                    )}
                  </p>
                  <button
                    className="primary full"
                    disabled={busy}
                    onClick={() => void makeShopping()}
                  >
                    <ShoppingBasket size={17} />
                    {t("Liste erstellen", "Create list")}
                  </button>
                </section>
                <section className="panel shopping-panel">
                  <div className="section-line">
                    <h2>{t("Einkaufen", "To buy")}</h2>
                    <button
                      className="icon-button"
                      aria-label={t("Liste herunterladen", "Download list")}
                      onClick={() =>
                        download(
                          state.shopping
                            .map(
                              (i) =>
                                `${i.checked ? "[x]" : "[ ]"} ${fmt(i.quantity)} ${i.unit} ${i.name}`,
                            )
                            .join("\n"),
                          "shopping-list.txt",
                          "text/plain",
                        )
                      }
                    >
                      <Download size={18} />
                    </button>
                  </div>
                  {state.shopping.map((i) => (
                    <label
                      key={i.id}
                      className={`shopping-item ${i.checked ? "done" : ""}`}
                    >
                      <Checkbox
                        checked={i.checked}
                        disabled={busy}
                        onCheckedChange={(v) =>
                          void commit({
                            ...state,
                            shopping: state.shopping.map((j) =>
                              j.id === i.id ? { ...j, checked: !!v } : j,
                            ),
                          })
                        }
                      />
                      <span dir="auto">{i.name}</span>
                      <strong>
                        {fmt(i.quantity)} {i.unit}
                      </strong>
                    </label>
                  ))}
                  {!state.shopping.length && (
                    <div className="small-empty">
                      <ShoppingBasket size={32} />
                      <p>
                        {t(
                          "Deine Einkaufsliste ist noch leer.",
                          "Your shopping list is empty.",
                        )}
                      </p>
                    </div>
                  )}
                  <button
                    className="text-button"
                    onClick={() => window.print()}
                  >
                    <Printer size={16} />
                    {t("Drucken / als PDF sichern", "Print / save as PDF")}
                  </button>
                </section>
              </div>
            </>
          ) : page === "tags" ? (
            <>
              <Heading
                eyebrow={t("DEINE EIGENE ORDNUNG", "YOUR OWN WAY TO ORGANIZE")}
                title={t("Tags & Zutaten", "Tags & ingredients")}
                subtitle={t(
                  "Von Yalda bis Weihnachten: Du bestimmst die Begriffe.",
                  "From Yalda to Christmas: make the vocabulary your own.",
                )}
              />
              <div className="two-columns">
                <section className="panel">
                  <h2>Tags</h2>
                  <form
                    className="inline-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const v = tagInput.trim();
                      if (!v) return;
                      if (
                        await commit({
                          ...state,
                          tags: [...new Set([...state.tags, v])],
                        })
                      )
                        setTagInput("");
                    }}
                  >
                    <input
                      value={tagInput}
                      maxLength={60}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Yalda, Christmas, Healthy …"
                      aria-label="New tag"
                    />
                    <button className="primary" disabled={busy}>
                      <Plus size={17} />
                    </button>
                  </form>
                  {tags.map((v) => (
                    <div key={v} className="tag-row">
                      <input
                        aria-label={`${v} rename`}
                        maxLength={60}
                        value={rename[v] ?? v}
                        onChange={(e) =>
                          setRename({ ...rename, [v]: e.target.value })
                        }
                      />
                      <button
                        className="secondary"
                        disabled={busy || !(rename[v] ?? v).trim()}
                        onClick={async () => {
                          const name = (rename[v] ?? v).trim();
                          await commit({
                            ...state,
                            tags: [
                              ...new Set(tags.map((a) => (a === v ? name : a))),
                            ],
                            recipes: state.recipes.map((r) => ({
                              ...r,
                              tags: [
                                ...new Set(
                                  r.tags.map((a) => (a === v ? name : a)),
                                ),
                              ],
                            })),
                          });
                        }}
                      >
                        {t("Umbenennen / vereinen", "Rename / merge")}
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`${v} delete`}
                        onClick={() => {
                          if (
                            window.confirm(
                              t(
                                "Tag aus allen Rezepten entfernen?",
                                "Remove tag from all recipes?",
                              ),
                            )
                          )
                            void commit({
                              ...state,
                              tags: tags.filter((a) => a !== v),
                              recipes: state.recipes.map((r) => ({
                                ...r,
                                tags: r.tags.filter((a) => a !== v),
                              })),
                            });
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <p className="small-text">
                    {t(
                      "Umbenennen gilt für alle Rezepte. Ein bereits vorhandener Name führt die Tags zusammen.",
                      "Renaming affects all recipes. An existing name merges the tags.",
                    )}
                  </p>
                </section>
                <section className="panel">
                  <h2>
                    {t("Eigene Zutaten-Aliase", "Custom ingredient aliases")}
                  </h2>
                  <p>
                    {t(
                      "Verknüpfe verschiedene Namen derselben Zutat.",
                      "Connect different names for the same ingredient.",
                    )}
                  </p>
                  <Field label={t("Hauptname", "Canonical name")}>
                    <input
                      value={aliasName}
                      maxLength={150}
                      onChange={(e) => setAliasName(e.target.value)}
                      placeholder="Kartoffel"
                    />
                  </Field>
                  <Field
                    label={t(
                      "Weitere Namen, mit Komma getrennt",
                      "Other names, separated by commas",
                    )}
                  >
                    <input
                      value={aliasValues}
                      onChange={(e) => setAliasValues(e.target.value)}
                      maxLength={2000}
                      dir="auto"
                      placeholder="potato, potatoes, سیب زمینی"
                    />
                  </Field>
                  <button
                    className="primary"
                    disabled={busy || !aliasName.trim() || !aliasValues.trim()}
                    onClick={async () => {
                      if (
                        await commit({
                          ...state,
                          aliases: [
                            ...state.aliases,
                            {
                              canonical: aliasName.trim(),
                              names: aliasValues
                                .split(",")
                                .map((v) => v.trim())
                                .filter(Boolean),
                            },
                          ],
                        })
                      ) {
                        setAliasName("");
                        setAliasValues("");
                      }
                    }}
                  >
                    {t("Alias speichern", "Save alias")}
                  </button>
                  {state.aliases.map((a, i) => (
                    <div className="alias-row" key={i}>
                      <p>
                        <strong dir="auto">{a.canonical}</strong>
                        <br />
                        <span dir="auto">{a.names.join(" · ")}</span>
                      </p>
                      <button
                        className="icon-button"
                        aria-label="Remove alias"
                        onClick={() =>
                          void commit({
                            ...state,
                            aliases: state.aliases.filter((_, k) => k !== i),
                          })
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <p className="small-text">
                    {t(
                      "Ein kleiner Grundwortschatz ist enthalten. Mandelmehl und gemahlene Mandeln bleiben getrennt. Bei unbekannten Begriffen helfen eigene Aliase.",
                      "A small base dictionary is included. Defatted almond flour and ground almonds stay separate. Add aliases for unknown terms.",
                    )}
                  </p>
                </section>
              </div>
            </>
          ) : (
            <>
              <Heading
                eyebrow={t(
                  "DEIN KOCHBUCH BLEIBT DEINS",
                  "YOUR COOKBOOK STAYS YOURS",
                )}
                title={t("Daten & Sicherung", "Data & backup")}
                subtitle={t(
                  "Ein gemeinsamer Speicher für Handy und Laptop. Ein Backup für dich.",
                  "Shared storage for phone and laptop. A backup for you.",
                )}
              />
              <div className="two-columns">
                <section className="panel">
                  <ShieldCheck className="panel-icon" />
                  <h2>{t("Privat & gesichert", "Private & protected")}</h2>
                  <p>
                    {t(
                      "Deine Daten werden zentral gespeichert und sind an dein angemeldetes Konto gebunden. Lade auf dem anderen Gerät dasselbe Kochbuch mit demselben Konto.",
                      "Your data is stored centrally and linked to your signed-in account. Open this cookbook with the same account on your other device.",
                    )}
                  </p>
                  <p className="small-text">
                    {t(
                      "Gleichzeitige Änderungen werden erkannt. Vor dem Bearbeiten auf einem anderen Gerät bitte neu laden.",
                      "Concurrent edits are detected. Reload before editing on another device.",
                    )}
                  </p>
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() => void exportBackup()}
                  >
                    <Download size={17} />
                    {t("Vollständiges Backup", "Full backup")}
                  </button>
                  <p className="small-text">
                    {t(
                      "JSON inklusive Fotos und früherer Rezeptversionen. Grenze: 14 MB Fotodaten, 20 MB Importdatei. Bewahre die Datei privat auf.",
                      "JSON includes photos and previous recipe versions. Limit: 14 MB of photo data, 20 MB import file. Keep the file private.",
                    )}
                  </p>
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => restoreInput.current?.click()}
                  >
                    <Upload size={17} />
                    {t("Backup wiederherstellen", "Restore backup")}
                  </button>
                  <input
                    ref={restoreInput}
                    type="file"
                    accept=".json,application/json"
                    hidden
                    onChange={(e) => {
                      if (e.target.files?.[0])
                        void parseRestore(e.target.files[0]);
                      e.target.value = "";
                    }}
                  />
                </section>
                <section className="panel">
                  <h2>
                    {t(
                      "AI ohne laufende API-Kosten",
                      "AI without ongoing API costs",
                    )}
                  </h2>
                  <p>
                    {t(
                      "Nutze Foto oder Text im Rezepteditor zum automatischen Ausfüllen. Alternativ kannst du einen strukturierten JSON-Entwurf aus einem Chat importieren.",
                      "Use photo or text in the recipe editor to fill fields automatically. Alternatively, import a structured JSON draft from a chat.",
                    )}
                  </p>
                  <button
                    className="secondary"
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(extractionPrompt)
                        .then(() =>
                          toast.success(t("Prompt kopiert", "Prompt copied")),
                        )
                        .catch(() =>
                          toast.error(
                            t("Kopieren nicht möglich", "Could not copy"),
                          ),
                        );
                    }}
                  >
                    <Copy size={16} />
                    {t("Extraktions-Prompt kopieren", "Copy extraction prompt")}
                  </button>
                  <p className="small-text">
                    {t(
                      "Foto-Texterkennung ist verfügbar. Eine LLM-Analyse und Internetrecherche sind noch nicht verbunden. Der optionale Check im Editor verwendet einfache Regeln.",
                      "Photo text recognition is available. LLM analysis and web research are not connected yet. The optional editor check uses simple rules.",
                    )}
                  </p>
                  <button
                    className="text-button"
                    onClick={() => {
                      setImportOpen(true);
                      setImportError("");
                    }}
                  >
                    {t("Entwurf importieren", "Import a draft")}
                  </button>
                </section>
              </div>
            </>
          )}
        </main>
        <footer className="app-footer">
          <span>My Cookbook</span>
          <span>
            {t("Ein Rezept nach dem anderen.", "One recipe at a time.")}
          </span>
        </footer>
      </SidebarInset>
      <Toaster position="bottom-right" richColors />
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="import-dialog">
          <DialogTitle>
            {t("Rezept importieren", "Import recipe")}
          </DialogTitle>
          <button className="primary" onClick={() => { setEditor({...newRecipe({title: "Draft", language: lang}), title: ""}); setImportOpen(false); }}>
            {t("Aus Foto oder Text ausfüllen", "Fill from photo or text")}
          </button>
          <DialogDescription>
            {t(
              "Kopiere das Prompt in einen Chat, füge dein Foto oder den Rezepttext hinzu und importiere die JSON-Antwort. Vor dem Speichern kannst du alles bearbeiten.",
              "Copy the prompt into a chat, attach your photo or recipe text, and import the JSON response. You can edit everything before saving.",
            )}
          </DialogDescription>
          <button
            className="secondary"
            onClick={() =>
              void navigator.clipboard
                .writeText(extractionPrompt)
                .then(() => toast.success(t("Prompt kopiert", "Prompt copied")))
                .catch(() =>
                  toast.error(t("Kopieren nicht möglich", "Could not copy")),
                )
            }
          >
            <Copy size={16} />
            {t("Prompt kopieren", "Copy prompt")}
          </button>
          <textarea
            className="json-input"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            maxLength={100000}
            placeholder={
              '{"title": "My recipe", "ingredients": [], "steps": []}'
            }
            aria-label="Recipe JSON"
          />
          {importError && <p className="form-error">{importError}</p>}
          <button className="primary" onClick={importDraft}>
            {t("Als Entwurf öffnen", "Open as draft")}
          </button>
        </DialogContent>
      </Dialog>
      {editor && (
        <RecipeEditor
          initial={editor}
          allTags={tags}
          busy={busy}
          lang={lang}
          onSave={saveRecipe}
          onClose={() => setEditor(null)}
        />
      )}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(v) => {
          if (!v) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            {t("Rezept löschen?", "Delete recipe?")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              "Das Rezept einschließlich seiner Notizen und Versionen wird entfernt. Exportiere bei Bedarf zuerst ein Backup.",
              "The recipe, notes and versions will be removed. Export a backup first if needed.",
            )}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Abbrechen", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const id = deleteId;
                void commit({
                  ...state,
                  recipes: state.recipes.filter((r) => r.id !== id),
                }).then((ok) => {
                  if (ok) setDetailId(null);
                });
                setDeleteId(null);
              }}
            >
              {t("Löschen", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!restoreData}
        onOpenChange={(v) => {
          if (!v) setRestoreData(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            {t("Kochbuch ersetzen?", "Replace cookbook?")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              "Dieses Backup ersetzt alle aktuellen Rezepte, Tags, Vorräte und die Einkaufsliste.",
              "This backup replaces all current recipes, tags, pantry and shopping items.",
            )}{" "}
            {restoreData?.state.recipes.length}{" "}
            {t(
              "Rezepte im Backup. Sichere zuerst deine aktuellen Daten.",
              "recipes in backup. Back up your current data first.",
            )}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Abbrechen", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void restore()}>
              {t("Wiederherstellen", "Restore")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
function Heading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}
function download(data: string, name: string, mime: string) {
  const url = URL.createObjectURL(new Blob([data], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
