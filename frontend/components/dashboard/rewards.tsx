"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBalance, fetchRewards, redeemReward } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { CoinBalance, Reward } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SpotlightCard } from "@/components/ui/spotlight-card";

export function Rewards() {
  const queryClient = useQueryClient();
  const balanceQuery = useQuery({
    queryKey: queryKeys.balance,
    queryFn: ({ signal }) => fetchBalance(signal),
    staleTime: 5_000,
  });
  const rewardsQuery = useQuery({
    queryKey: queryKeys.rewards,
    queryFn: ({ signal }) => fetchRewards(signal),
    staleTime: Number.POSITIVE_INFINITY,
  });

  const [selected, setSelected] = useState<Reward | null>(null);
  const [selectedBalance, setSelectedBalance] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (reward: Reward) => redeemReward(reward.id),
    onMutate: async (reward) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.balance });
      const previous = queryClient.getQueryData<CoinBalance>(queryKeys.balance);

      if (previous) {
        queryClient.setQueryData<CoinBalance>(queryKeys.balance, {
          balance: Math.max(0, previous.balance - reward.coin_cost),
        });
      }

      return { previous };
    },
    onError: (_error, _reward, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.balance, context.previous);
      }
    },
    onSuccess: (result) => {
      queryClient.setQueryData<CoinBalance>(queryKeys.balance, { balance: result.balance });
      setSelected(null);
      setSuccess(`${result.reward.title} redeemed`);
      window.setTimeout(() => setSuccess(null), 3500);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.balance }),
  });

  const balance = balanceQuery.data?.balance ?? 0;
  const balanceReady = balanceQuery.isSuccess;

  return (
    <section className="rewards-section" id="rewards" aria-labelledby="rewards-title">
      <div className="section-heading section-heading--compact rewards-heading">
        <div>
          <span className="section-index">03</span>
          <div>
            <p className="eyebrow">Rewards</p>
            <h2 id="rewards-title">Redeem earned value</h2>
          </div>
        </div>
        <div className="coin-balance">
          <span className="coin-mark" aria-hidden="true">◆</span>
          <div>
            <small>Available balance</small>
            <strong>
              {balanceQuery.isError ? "Unavailable" : `${balance.toLocaleString("en-IN")} coins`}
            </strong>
          </div>
        </div>
      </div>

      <p className="rewards-intro">
        Select a reward, review the balance impact, and confirm. Failed redemptions restore the optimistic balance automatically.
      </p>

      {rewardsQuery.isError ? (
        <div className="rewards-error" role="alert">
          <strong>Rewards catalogue couldn’t load.</strong>
          <span>Your transaction data is unaffected. Check the API and retry.</span>
        </div>
      ) : (
        <div className="rewards-grid">
          {rewardsQuery.isPending
            ? Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="reward-card reward-card--skeleton" />
              ))
            : rewardsQuery.data?.map((reward, index) => {
                const affordable = balanceReady && balance >= reward.coin_cost;
                const label = !balanceReady
                  ? "Checking balance…"
                  : affordable
                    ? "Redeem reward"
                    : `Need ${(reward.coin_cost - balance).toLocaleString("en-IN")} more`;

                return (
                  <SpotlightCard
                    className={`reward-card ${index === 0 ? "reward-card--featured" : ""}`}
                    key={reward.id}
                    role="article"
                    aria-labelledby={`reward-${reward.id}`}
                  >
                    <div className="reward-card__top">
                      <span className="reward-glyph" aria-hidden="true">
                        {reward.kind === "cashback" ? "₹" : "✦"}
                      </span>
                      <span className="reward-cost">
                        <i aria-hidden="true">◆</i>
                        {reward.coin_cost.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="reward-card__body">
                      <small>{reward.value_label}</small>
                      <h3 id={`reward-${reward.id}`}>{reward.title}</h3>
                      <p>{reward.description}</p>
                    </div>

                    <Button
                      variant={affordable ? "primary" : "secondary"}
                      disabled={!affordable || mutation.isPending}
                      onClick={() => {
                        setSelected(reward);
                        setSelectedBalance(balance);
                        mutation.reset();
                      }}
                    >
                      {label}
                    </Button>
                  </SpotlightCard>
                );
              })}
        </div>
      )}

      {success ? (
        <div className="toast" role="status">
          <span>✓</span>
          {success}
        </div>
      ) : null}

      <Modal
        open={Boolean(selected)}
        onClose={() => !mutation.isPending && setSelected(null)}
        title="Confirm redemption"
      >
        {selected ? (
          <div className="confirm-redeem">
            <div className="confirm-redeem__reward">
              <span className="reward-glyph">{selected.kind === "cashback" ? "₹" : "✦"}</span>
              <div>
                <strong>{selected.title}</strong>
                <span>{selected.description}</span>
              </div>
            </div>
            <div className="balance-preview">
              <span>Current balance <strong>{selectedBalance.toLocaleString("en-IN")}</strong></span>
              <span>Reward cost <strong>−{selected.coin_cost.toLocaleString("en-IN")}</strong></span>
              <hr />
              <span>
                After redeem{" "}
                <strong>
                  {Math.max(0, selectedBalance - selected.coin_cost).toLocaleString("en-IN")}
                </strong>
              </span>
            </div>
            {mutation.isError ? (
              <p className="inline-error" role="alert">
                Redemption failed. Your coin balance has been restored; please try again.
              </p>
            ) : null}
            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => setSelected(null)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={() => mutation.mutate(selected)} disabled={mutation.isPending}>
                {mutation.isPending ? "Redeeming…" : `Redeem for ${selected.coin_cost.toLocaleString("en-IN")} coins`}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
