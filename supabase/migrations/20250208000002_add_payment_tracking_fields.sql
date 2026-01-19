-- Add fields for tracking payment status, refunds, disputes, and cancellations
ALTER TABLE requests ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE requests ADD COLUMN IF NOT EXISTS payment_failure_reason TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS refund_amount_cents INTEGER;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS dispute_id TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS dispute_reason TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS dispute_status TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- Add indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_requests_payment_status ON requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_requests_dispute_id ON requests(dispute_id);
CREATE INDEX IF NOT EXISTS idx_requests_cancelled_at ON requests(cancelled_at);

-- Add comments for documentation
COMMENT ON COLUMN requests.payment_status IS 'Current payment status: pending, succeeded, failed, cancelled, refunded, disputed, lost';
COMMENT ON COLUMN requests.payment_failure_reason IS 'Reason why payment failed (from Stripe)';
COMMENT ON COLUMN requests.refunded_at IS 'When payment was refunded';
COMMENT ON COLUMN requests.refund_amount_cents IS 'Amount refunded in cents';
COMMENT ON COLUMN requests.dispute_id IS 'Stripe Dispute ID if payment was disputed';
COMMENT ON COLUMN requests.dispute_reason IS 'Reason for dispute (from Stripe)';
COMMENT ON COLUMN requests.dispute_status IS 'Dispute status: warning_needs_response, warning_under_review, warning_closed, needs_response, under_review, won, lost';
COMMENT ON COLUMN requests.cancellation_reason IS 'Reason provided when request was cancelled';
COMMENT ON COLUMN requests.cancelled_at IS 'When request was cancelled';
