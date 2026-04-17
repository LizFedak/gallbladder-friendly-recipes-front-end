import Link from "next/link";
import { client } from "@/sanity/client";

type Recipe = {
  _id: string;
  title: string;
  slug?: { current?: string };
  excerpt?: string;
  publishedAt?: string;
  featured?: boolean;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients?: string[];
  instructions?: string[];
  dietTags?: string[];
  categories?: Array<{
    _id: string;
    title?: string;
  }>;
  coverImage?: {
    alt?: string;
    asset?: {
      url?: string;
    };
  };
};

const RECIPES_QUERY = `*[
  _type == "recipe" &&
  defined(slug.current)
] | order(featured desc, publishedAt desc) {
  _id,
  title,
  slug,
  excerpt,
  publishedAt,
  featured,
  prepTime,
  cookTime,
  servings,
  ingredients,
  instructions,
  dietTags,
  categories[]->{
    _id,
    title
  },
  coverImage{
    alt,
    asset->{
      url
    }
  }
}`;

const options = { next: { revalidate: 30 } };

function formatDate(date?: string) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTotalTime(prepTime?: number, cookTime?: number) {
  return (prepTime || 0) + (cookTime || 0);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; tag?: string }>;
}) {
  const params = (await searchParams) ?? {};

  const recipes = await client.fetch<Recipe[]>(RECIPES_QUERY, {}, options);

  const q = (params.q ?? "").trim().toLowerCase();
  const selectedTag = (params.tag ?? "").trim().toLowerCase();

  const allTags = Array.from(
    new Set(recipes.flatMap((recipe) => recipe.dietTags || []).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesQuery =
      !q ||
      recipe.title.toLowerCase().includes(q) ||
      recipe.excerpt?.toLowerCase().includes(q) ||
      recipe.ingredients?.some((ingredient) =>
        ingredient.toLowerCase().includes(q)
      );

    const matchesTag =
      !selectedTag ||
      (recipe.dietTags || []).some(
        (tag) => tag.toLowerCase() === selectedTag
      );

    return matchesQuery && matchesTag;
  });

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <section className="mx-auto max-w-6xl px-6 py-10 md:px-8 md:py-14">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
            Gallbladder-Friendly Recipes
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Clean, practical recipes that are easier on digestion.
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-600 md:text-lg">
            Filter by diet, browse quick meals, and keep the content simple and
            structured.
          </p>
        </div>

        <form className="mt-8 rounded-3xl border border-zinc-200 bg-zinc-50 p-4 md:p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_220px_120px]">
            <input
              type="text"
              name="q"
              defaultValue={params.q || ""}
              placeholder="Search recipes..."
              className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-500"
            />

            <select
              name="tag"
              defaultValue={params.tag || ""}
              className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-500"
            >
              <option value="">All diet tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Filter
            </button>
          </div>
        </form>

        <div className="mt-6 text-sm text-zinc-500">
          {filteredRecipes.length} recipe
          {filteredRecipes.length === 1 ? "" : "s"} found
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-8">
            <h2 className="text-xl font-semibold">No recipes found</h2>
            <p className="mt-2 text-zinc-600">
              Try a different search or add a few recipe documents in Sanity.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {filteredRecipes.map((recipe) => {
              const slug = recipe.slug?.current;
              const imageUrl = recipe.coverImage?.asset?.url;
              const altText = recipe.coverImage?.alt || recipe.title;
              const totalTime = getTotalTime(recipe.prepTime, recipe.cookTime);

              return (
                <article
                  key={recipe._id}
                  className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  {imageUrl ? (
                    <Link href={`/recipes/${slug}`}>
                      <img
                        src={imageUrl}
                        alt={altText}
                        className="h-56 w-full object-cover"
                      />
                    </Link>
                  ) : (
                    <Link
                      href={`/recipes/${slug}`}
                      className="flex h-56 w-full flex-col justify-between bg-gradient-to-br from-emerald-50 via-lime-50 to-white p-6 text-left"
                    >
                      <div className="flex flex-wrap gap-2">
                        {recipe.dietTags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-emerald-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          Recipe
                        </p>
                        <p className="mt-2 text-2xl font-semibold leading-tight text-zinc-900">
                          {recipe.title}
                        </p>
                      </div>
                    </Link>
                  )}

                  <div className="p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      {recipe.featured && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-800">
                          Featured
                        </span>
                      )}
                      {recipe.publishedAt && <span>{formatDate(recipe.publishedAt)}</span>}
                    </div>

                    {/* <Link href={`/recipes/${slug}`} className="block">
                      <h2 className="text-2xl font-semibold tracking-tight hover:underline">
                        {recipe.title}
                      </h2>
                    </Link> */}

                    {recipe.excerpt && (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">
                        {recipe.excerpt}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-600">
                      {typeof recipe.prepTime === "number" && (
                        <span className="rounded-full bg-zinc-100 px-3 py-1">
                          Prep {recipe.prepTime}m
                        </span>
                      )}
                      {typeof recipe.cookTime === "number" && (
                        <span className="rounded-full bg-zinc-100 px-3 py-1">
                          Cook {recipe.cookTime}m
                        </span>
                      )}
                      {totalTime > 0 && (
                        <span className="rounded-full bg-zinc-100 px-3 py-1">
                          Total {totalTime}m
                        </span>
                      )}
                      {typeof recipe.servings === "number" && (
                        <span className="rounded-full bg-zinc-100 px-3 py-1">
                          Serves {recipe.servings}
                        </span>
                      )}
                    </div>

                    {!!recipe.dietTags?.length && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {recipe.dietTags.map((tag) => (
                          <Link
                            key={tag}
                            href={`/?tag=${encodeURIComponent(tag)}`}
                            className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                          >
                            {tag}
                          </Link>
                        ))}
                      </div>
                    )}

                    {!!recipe.categories?.length && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {recipe.categories.map((category) =>
                          category.title ? (
                            <span
                              key={category._id}
                              className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700"
                            >
                              {category.title}
                            </span>
                          ) : null
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}