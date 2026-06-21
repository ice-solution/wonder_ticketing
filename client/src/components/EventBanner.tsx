type EventBannerProps = {
  url?: string | null;
  title: string;
  variant?: "card" | "hero";
};

export function EventBanner({ url, title, variant = "card" }: EventBannerProps) {
  if (variant === "hero") {
    if (url) {
      return (
        <div className="mb-6 overflow-hidden rounded-xl">
          <img
            src={url}
            alt=""
            className="h-44 w-full object-cover sm:h-56 md:h-64 lg:h-72"
          />
        </div>
      );
    }
    return (
      <div
        className="mb-6 flex h-44 w-full items-center justify-center rounded-xl bg-gradient-to-br from-wonder-primary/15 via-slate-100 to-slate-200 sm:h-56 md:h-64 lg:h-72"
        aria-hidden
      >
        <span className="text-4xl font-light text-slate-400/80 sm:text-5xl">
          {title.slice(0, 1)}
        </span>
      </div>
    );
  }

  if (url) {
    return <img src={url} alt="" className="mb-3 h-32 w-full rounded-lg object-cover" />;
  }
  return (
    <div
      className="mb-3 flex h-32 w-full items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-sm text-slate-400"
      aria-hidden
    >
      {title.slice(0, 1)}
    </div>
  );
}
