export default function Loading() {
  return (
    <main className="app-shell bg-[#f7f4ed] px-4 py-5 text-[#25322b] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="h-4 w-28 animate-pulse rounded-full bg-[#e5ded2]" />
            <div className="mt-3 h-10 w-56 animate-pulse rounded-2xl bg-[#e9e3d8]" />
          </div>
          <div className="size-11 animate-pulse rounded-2xl bg-[#e5ded2]" />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[2rem] border border-[#e2dfd6] bg-[#fffdf8] p-5 shadow-sm">
            <div className="h-5 w-32 animate-pulse rounded-full bg-[#e5ded2]" />
            <div className="mt-4 h-12 animate-pulse rounded-2xl bg-[#eee8dd]" />
            <div className="mt-3 h-12 animate-pulse rounded-2xl bg-[#eee8dd]" />
            <div className="mt-5 h-12 animate-pulse rounded-xl bg-[#025026]/25" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[1.7rem] border border-[#e2dfd6] bg-white shadow-sm"
              >
                <div className="h-36 animate-pulse bg-[#e5ded2]" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-20 animate-pulse rounded-full bg-[#e5ded2]" />
                  <div className="h-7 animate-pulse rounded-xl bg-[#eee8dd]" />
                  <div className="h-16 animate-pulse rounded-xl bg-[#f2eee6]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
