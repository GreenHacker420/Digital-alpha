"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBalance, fetchRewards, redeemReward } from "@/lib/api";
import type { CoinBalance, Reward } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function Rewards() {
  const queryClient = useQueryClient();
  const { data: balanceData } = useQuery({ queryKey: ["balance"], queryFn: fetchBalance });
  const { data: rewards, isPending } = useQuery({ queryKey: ["rewards"], queryFn: fetchRewards });
  const [selected, setSelected] = useState<Reward | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (reward: Reward) => redeemReward(reward.id),
    onMutate: async (reward) => {
      await queryClient.cancelQueries({ queryKey: ["balance"] });
      const previous = queryClient.getQueryData<CoinBalance>(["balance"]);
      if (previous) queryClient.setQueryData<CoinBalance>(["balance"], { balance: previous.balance - reward.coin_cost });
      return { previous };
    },
    onError: (_error, _reward, context) => {
      if (context?.previous) queryClient.setQueryData(["balance"], context.previous);
    },
    onSuccess: (result) => {
      queryClient.setQueryData<CoinBalance>(["balance"], { balance: result.balance });
      setSelected(null);
      setSuccess(`${result.reward.title} redeemed`);
      window.setTimeout(() => setSuccess(null), 3500);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["balance"] }),
  });

  const balance = balanceData?.balance ?? 0;

  return (
    <section className="rewards-section" id="rewards">
      <div className="section-heading"><div><p className="eyebrow">Rewards</p><h2>Turn payments into something useful.</h2></div><div className="coin-balance"><span>◆</span><div><small>Available</small><strong>{balance.toLocaleString("en-IN")} coins</strong></div></div></div>

      <div className="rewards-strip">
        {isPending ? Array.from({ length: 4 }, (_, i) => <div key={i} className="reward-card reward-card--skeleton" />) : rewards?.map((reward) => {
          const affordable = balance >= reward.coin_cost;
          return (
            <article className="reward-card" key={reward.id}>
              <div className="reward-card__top"><span className="reward-glyph">{reward.kind === "cashback" ? "₹" : "✦"}</span><span className="reward-cost">◆ {reward.coin_cost}</span></div>
              <div><small>{reward.value_label}</small><h3>{reward.title}</h3><p>{reward.description}</p></div>
              <Button variant={affordable ? "primary" : "secondary"} disabled={!affordable || mutation.isPending} onClick={() => setSelected(reward)}>{affordable ? "Redeem" : `Need ${reward.coin_cost - balance} more`}</Button>
            </article>
          );
        })}
      </div>

      {success ? <div className="toast" role="status"><span>✓</span>{success}</div> : null}

      <Modal open={Boolean(selected)} onClose={() => !mutation.isPending && setSelected(null)} title="Confirm redemption">
        {selected ? (
          <div className="confirm-redeem">
            <div className="confirm-redeem__reward"><span className="reward-glyph">{selected.kind === "cashback" ? "₹" : "✦"}</span><div><strong>{selected.title}</strong><span>{selected.description}</span></div></div>
            <div className="balance-preview"><span>Current balance <strong>{balance.toLocaleString("en-IN")}</strong></span><span>Reward cost <strong>−{selected.coin_cost.toLocaleString("en-IN")}</strong></span><hr/><span>After redeem <strong>{Math.max(0, balance - selected.coin_cost).toLocaleString("en-IN")}</strong></span></div>
            {mutation.isError ? <p className="inline-error" role="alert">Redemption failed. Your coin balance has been restored; please try again.</p> : null}
            <div className="modal-actions"><Button variant="secondary" onClick={() => setSelected(null)} disabled={mutation.isPending}>Cancel</Button><Button onClick={() => mutation.mutate(selected)} disabled={mutation.isPending}>{mutation.isPending ? "Redeeming…" : `Redeem for ${selected.coin_cost} coins`}</Button></div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
