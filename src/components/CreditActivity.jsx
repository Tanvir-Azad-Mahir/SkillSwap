import { ArrowDownLeft, ArrowUpRight, Coins } from "lucide-react";

function formatType(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function CreditActivity({ wallet, transactions = [] }) {
  return (
    <section className="border border-white/10 bg-[#0a0d0b]/65">
      <div className="flex items-end justify-between border-b border-white/10 p-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#a1a1aa]">
            SS economy
          </p>
          <h2 className="mt-1 text-xl font-medium tracking-[-0.03em]">
            Credit activity
          </h2>
        </div>

        <Coins size={20} strokeWidth={1.4} className="text-[#c7ff39]" />
      </div>

      <div className="p-5">
        {!wallet ? (
          <div className="border border-dashed border-white/10 px-5 py-8 text-center">
            <p className="text-sm text-[#a1a1aa]">
              Credit wallet is not configured yet.
            </p>
            <p className="mt-1 text-xs leading-5 text-white/30">
              Run the included credit SQL setup to activate the welcome bonus.
            </p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="border border-dashed border-white/10 px-5 py-8 text-center text-sm text-[#a1a1aa]">
            No credit activity yet.
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((transaction) => {
              const positive = Number(transaction.amount) >= 0;
              const Icon = positive ? ArrowDownLeft : ArrowUpRight;

              return (
                <div
                  key={transaction.id}
                  className="flex items-center gap-3 border-b border-white/[0.06] py-3 last:border-b-0"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center border border-white/10 text-[#a1a1aa]">
                    <Icon size={14} strokeWidth={1.5} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {transaction.description ||
                        formatType(transaction.transaction_type)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-white/30">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>

                  <p
                    className={`text-sm font-medium tabular-nums ${
                      positive ? "text-[#c7ff39]" : "text-[#f2f4ef]"
                    }`}
                  >
                    {positive ? "+" : ""}
                    {transaction.amount} SS
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
