import type { Transaction } from "@/lib/types";
import { formatDateTime, formatMoney, titleCase } from "@/lib/format";
import { Modal } from "@/components/ui/modal";

export function TransactionModal({ transaction, onClose }: { transaction: Transaction | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(transaction)} onClose={onClose} title={transaction?.merchant_name ?? "Transaction"}>
      {transaction ? (
        <div className="transaction-detail">
          <div className="transaction-detail__hero"><span className="merchant-mark merchant-mark--large">{transaction.merchant_name.slice(0, 1).toUpperCase()}</span><div><span>{transaction.category}</span><strong>{formatMoney(transaction.amount, transaction.currency)}</strong><small>{titleCase(transaction.status)}</small></div></div>
          <dl className="detail-grid">
            <div><dt>Date & time</dt><dd>{formatDateTime(transaction.occurred_at)}</dd></div>
            <div><dt>Payment method</dt><dd>{transaction.payment_method ?? "Not provided"}</dd></div>
            <div><dt>Reference</dt><dd>{transaction.reference_id ?? transaction.id}</dd></div>
            <div><dt>Currency</dt><dd>{transaction.currency}</dd></div>
          </dl>
          {transaction.description ? <div className="detail-note"><span>Note</span><p>{transaction.description}</p></div> : null}
        </div>
      ) : null}
    </Modal>
  );
}
