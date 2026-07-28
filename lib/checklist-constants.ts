export const PHASE_CHECKLIST_FIELDS: Record<string, string[]> = {
  "RAW_MATERIALS": [
    "rm_billNumberVerified", "rm_modelNumberVerified", "rm_descriptionVerified", 
    "rm_quantityVerified", "rm_printerAssigned", "rm_dtpAssigned", 
    "rm_colourExplainedToCustomer", "rm_leadTimeExplained", 
    "rm_wastageRemarksAdjusted", "rm_dtpAssignedAndStarted"
  ],
  "DESIGN": [
    "d_materialCardsReceived", "d_dtpConfirmed", "d_cardsStockUpdated", 
    "d_currentStockChecked", "d_stickersQualityChecked", "d_stickerQualityUpdated", 
    "d_logoCheckedOnDtp", "d_printerScheduleInformed", "d_dtpSentToCustomer"
  ],
  "PRINTING": [
    "p_namePlatesReceived1", "p_namePlatesQualityChecked", "p_dtpConfirmedByCustomer", 
    "p_namePlatesReceivedFinal", "p_signaturesFromCustomer", "p_leadTimeUpdated", 
    "p_leftRightExplained", "p_masterTracingsReady", "p_samplesCollectedFromDtp", 
    "p_masterCheckWithPdfCard", "p_timeColourWrittenOnCards", "p_timeColourSentInGroup", 
    "p_cardOrientationSentToGroup", "p_materialSentToPrinter", "p_estimatedPrintingDateSet", 
    "p_printerFollowUp", "p_cardOrientationConfirmed"
  ],
  "POST_PRINTING": [
    "pp_paddingBoxingScheduled", "pp_printedMaterialReceived", "pp_printedMaterialQC", 
    "pp_cardsToBinder", "pp_binderFollowUp", "pp_estimatedTimeToBinder", 
    "pp_endProductCheck", "pp_sampleExchanged", "pp_customerInformedBag", 
    "pp_customerInformedReadiness", "pp_paymentCollected", "pp_reminderFollowUp", 
    "pp_ratingTaken", "pp_checkRatingName", "pp_balanceCollected"
  ],
  "PAYMENT_PENDING": [
    "pay_invoiceAmountConfirmed", "pay_paymentReminderSent", "pay_partialPaymentReceived", 
    "pay_fullPaymentReceived", "pay_receiptIssued"
  ]
};
