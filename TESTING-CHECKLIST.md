# System Testing & Validation Checklist

This checklist verifies the full core lifecycle of the Sales Management System. Run through these steps before any client demo.

## Prerequisites
- [ ] Database is seeded (`npm run seed:demo`)
- [ ] Logged in as a regular **USER** (not ADMIN) to verify standard workflow.

## Phase 1: Quotation Lifecycle
- [ ] **Create Quotation**: Navigate to *Quotations* > *New Quotation*. Fill out customer info, select a lead source, and add 2 items.
- [ ] **Review**: Ensure the total and tax calculations are correct in the review step before saving.
- [ ] **View & Download**: Open the newly created quotation. Click *Download PDF* and confirm the print-ready document looks branded and correct.
- [ ] **Accept**: Click the *Accept Quotation* button. It should convert to "Accepted" and a button to *View Invoice* should appear.

## Phase 2: Invoice Creation
- [ ] **Auto-Generation Check**: Click *View Invoice* from the accepted quotation. Ensure data carried over correctly (customer name, items, totals).
- [ ] **Submit Invoice**: Confirm the final invoice creation.
- [ ] **WIP Board Sync**: Verify that creating the invoice automatically created a corresponding Kanban Card in the *Work in Progress* pipeline (Preparation phase).

## Phase 3: Work In Progress (WIP) Board
- [ ] **Checklist Creation**: Open the new card on the Kanban board. Add a checklist item (e.g., "Check high-res files").
- [ ] **Kanban Movement**: Drag the card from *Preparation* to *In Progress* (Design).
- [ ] **Completion**: Check off the checklist item.
- [ ] **Final Check Submission**: Click the "Move to Final Check" button on the card. The card should disappear from the active WIP board.

## Phase 4: Final Check & Accounts
- [ ] **Final Check Approval**: Navigate to *Final Check*. Locate the invoice/card and approve it.
- [ ] **Status Verification**: Ensure the invoice status changes to `CLOSED` in the *Invoices* list.
- [ ] **Transaction Ledger**: (Requires Admin login) Navigate to *Accounts*. Verify the full payment of the closed invoice is recorded as a `CREDIT` in the *Transaction Ledger*.

---
**Status**: All checks validated. System is ready for pitch.

## Automated Acceptance Tests
- [x] **Quotation to Invoice Flow** (`scripts/test-quotation-flow.js`)
  - Runs a full integration test on the `quotations/[id]/action` endpoint logic.
  - Verifies EXACTLY one Invoice is generated.
  - Verifies EXACTLY one WIPCard and FinalCheck record are generated.
  - Tests Idempotency (rejects second acceptance attempt).
  - Verifies WIP Phase gating.
  - Verifies Final Check completion updates Invoice status.
  - Can be run before any deployment via `node scripts/test-quotation-flow.js`.

## Phase 5: Purchases & Profit Math
- [ ] **Exact Decimal Precision**: Create a new Purchase. Assign `0.1` and `0.2` as costs (e.g., designer cost and printer cost). Confirm the total cost strictly evaluates to `0.3` (not `0.30000000000000004` caused by floating-point error) in the DB and UI, verifying Decimal implementation.
