import { notFound } from "next/navigation";
import Link from "next/link";
import { client } from "@/sanity/client";

type RecipePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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

const RECIPE_QUERY = `*[
  _type == "recipe" &&
  slug.current == $slug
][0]{
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

export async function generateMetadata({ params }: RecipePageProps) {
  const { slug } = await params;

  const recipe = await client.fetch<Recipe>(RECIPE_QUERY, { slug }, options);

  if (!recipe) {
    return {
      title: "Recipe Not Found",
    };
  }

  return {
    title: recipe.title,
    description: recipe.excerpt || `View the recipe for ${recipe.title}.`,
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params;

  const recipe = await client.fetch<Recipe>(RECIPE_QUERY, { slug }, options);

  if (!recipe) {
    notFound();
  }

  const imageUrl = recipe.coverImage?.asset?.url;
  const altText = recipe.coverImage?.alt || recipe.title;
  const totalTime = getTotalTime(recipe.prepTime, recipe.cookTime);

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <article className="mx-auto max-w-4xl px-6 py-10 md:px-8 md:py-14">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            ← Back to recipes
          </Link>
        </div>

        <header className="mb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            {recipe.featured && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">
                Featured
              </span>
            )}
            {recipe.publishedAt && <span>{formatDate(recipe.publishedAt)}</span>}
          </div>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            {recipe.title}
          </h1>

          {recipe.excerpt && (
            <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600">
              {recipe.excerpt}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2 text-sm text-zinc-700">
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
        </header>

        {imageUrl && (
          <div className="mb-10 overflow-hidden rounded-3xl border border-zinc-200">
            <img
              src={imageUrl}
              alt={altText}
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        <div className="grid gap-10 md:grid-cols-[1fr_1.3fr]">
          <section>
            <h2 className="text-2xl font-semibold tracking-tight">Ingredients</h2>

            {recipe.ingredients?.length ? (
              <ul className="mt-4 space-y-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <li
                    key={`${ingredient}-${index}`}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-800"
                  >
                    {ingredient}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">
                No ingredients listed yet.
              </p>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight">Instructions</h2>

            {recipe.instructions?.length ? (
              <ol className="mt-4 space-y-4">
                {recipe.instructions.map((step, index) => (
                  <li
                    key={`${step}-${index}`}
                    className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <p className="pt-1 text-sm leading-7 text-zinc-800">{step}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">
                No instructions listed yet.
              </p>
            )}
          </section>
        </div>
      </article>
    </main>
  );
}