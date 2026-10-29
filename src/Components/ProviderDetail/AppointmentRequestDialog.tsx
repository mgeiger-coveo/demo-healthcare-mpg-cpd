import {
  FunctionComponent,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import styled from "styled-components";
import AppointmentConfirmationStep from "./AppointmentConfirmationStep";
import AppointmentOptionGroup from "./AppointmentOptionGroup";
import AppointmentReviewStep from "./AppointmentReviewStep";
import {
  APPOINTMENT_STEP_ORDER,
  AppointmentStep,
  AppointmentVisitTypeKey,
  appointmentRequestReducer,
  canAdvanceFromStep,
  canSubmitAppointmentRequest,
  createAppointmentRequestState,
  getAppointmentLocationOptions,
  getAppointmentStepIndex,
  getEligibleVisitTypeKeys,
} from "./appointmentRequestUtils";
import { recordAppointmentSubmitted } from "./appointmentAnalytics";
import { formatTemplate } from "./providerDetailUtils";
import { CommerceEngineContext } from "../../common/engineContext";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import { MPGConfigTranslations } from "../../config/InternationalizationConfig";
import {
  MPG_APPOINTMENT_BACK_LABEL,
  MPG_APPOINTMENT_CANCEL_LABEL,
  MPG_APPOINTMENT_CONTINUE_LABEL,
  MPG_APPOINTMENT_DIALOG_CLOSE_LABEL,
  MPG_APPOINTMENT_DIALOG_TITLE,
  MPG_APPOINTMENT_LOCATION_GROUP_LABEL,
  MPG_APPOINTMENT_LOCATION_HEADING,
  MPG_APPOINTMENT_LOCATION_HINT,
  MPG_APPOINTMENT_LOCATION_UNAVAILABLE_BODY,
  MPG_APPOINTMENT_LOCATION_UNAVAILABLE_TITLE,
  MPG_APPOINTMENT_STEP_CONFIRMATION_LABEL,
  MPG_APPOINTMENT_STEP_LOCATION_LABEL,
  MPG_APPOINTMENT_STEP_PROGRESS_TEMPLATE,
  MPG_APPOINTMENT_STEP_REVIEW_LABEL,
  MPG_APPOINTMENT_STEP_VISIT_TYPE_LABEL,
  MPG_APPOINTMENT_SUBMIT_LABEL,
  MPG_APPOINTMENT_VISIT_TYPE_DEMO_NOTE,
  MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP,
  MPG_APPOINTMENT_VISIT_TYPE_GROUP_LABEL,
  MPG_APPOINTMENT_VISIT_TYPE_HEADING,
  MPG_APPOINTMENT_VISIT_TYPE_HINT,
  MPG_APPOINTMENT_VISIT_TYPE_NEW_PATIENT,
  MPG_APPOINTMENT_VISIT_TYPE_TELEHEALTH,
  MPG_APPOINTMENT_REVIEW_HEADING,
} from "../../config/MPGConfig";
import { Theme } from "../../config/theme";

interface AppointmentRequestDialogProps {
  open: boolean;
  onClose: () => void;
  product: any;
  providerName: string;
  specialtyLine: string;
  discoveryPath: string;
}

const TITLE_ID = "appointment-request-dialog-title";
const HINT_ID = "appointment-request-dialog-hint";

// Visit-type copy, keyed by the pure module's keys. Defined here rather than in the pure
// module so the rules stay free of localization concerns.
const VISIT_TYPE_COPY: Record<
  AppointmentVisitTypeKey,
  { text: string; key: string }
> = {
  newPatient: {
    text: MPG_APPOINTMENT_VISIT_TYPE_NEW_PATIENT,
    key: "appointmentVisitTypeNewPatient",
  },
  followUp: {
    text: MPG_APPOINTMENT_VISIT_TYPE_FOLLOW_UP,
    key: "appointmentVisitTypeFollowUp",
  },
  telehealth: {
    text: MPG_APPOINTMENT_VISIT_TYPE_TELEHEALTH,
    key: "appointmentVisitTypeTelehealth",
  },
};

const STEP_LABEL_COPY: Record<string, { text: string; key: string }> = {
  location: {
    text: MPG_APPOINTMENT_STEP_LOCATION_LABEL,
    key: "appointmentStepLocationLabel",
  },
  visitType: {
    text: MPG_APPOINTMENT_STEP_VISIT_TYPE_LABEL,
    key: "appointmentStepVisitTypeLabel",
  },
  review: {
    text: MPG_APPOINTMENT_STEP_REVIEW_LABEL,
    key: "appointmentStepReviewLabel",
  },
  confirmation: {
    text: MPG_APPOINTMENT_STEP_CONFIRMATION_LABEL,
    key: "appointmentStepConfirmationLabel",
  },
};

// The simulated appointment request. Four steps, no backend, no persistence and no
// network: the dialog derives everything it shows from the product it is handed and from
// local reducer state, and submitting only moves that state to the confirmation step.
//
// The Dialog is deliberately not `keepMounted`, so closing unmounts this subtree and
// discards the reducer state. Reopening therefore always starts from a clean request —
// reset is structural rather than a cleanup effect, and nothing can leak across a cycle.
const AppointmentRequestDialog: FunctionComponent<
  AppointmentRequestDialogProps
> = (props) => {
  const { open, onClose, product, providerName, specialtyLine, discoveryPath } =
    props;
  const { getText } = useContext(LanguageContext);
  // The single Commerce engine built once in App.tsx. Read, never constructed.
  const commerceEngine = useContext(CommerceEngineContext);
  // One submission per mounted attempt. The dialog is not `keepMounted`, so closing
  // unmounts this subtree and a reopen starts from an unlatched ref.
  const submittedRef = useRef(false);

  const [state, dispatch] = useReducer(
    appointmentRequestReducer,
    product,
    (p) =>
      createAppointmentRequestState(
        getAppointmentLocationOptions(p),
        getEligibleVisitTypeKeys(p),
      ),
  );

  const visitTypeLabel = (key: AppointmentVisitTypeKey) =>
    getText(
      VISIT_TYPE_COPY[key].text,
      MPGConfigTranslations,
      VISIT_TYPE_COPY[key].key,
    );

  const stepIndex = getAppointmentStepIndex(state.step);
  const progressLine = formatTemplate(
    getText(
      MPG_APPOINTMENT_STEP_PROGRESS_TEMPLATE,
      MPGConfigTranslations,
      "appointmentStepProgressTemplate",
    ),
    {
      current: String(stepIndex + 1),
      total: String(APPOINTMENT_STEP_ORDER.length),
      label: getText(
        STEP_LABEL_COPY[state.step].text,
        MPGConfigTranslations,
        STEP_LABEL_COPY[state.step].key,
      ),
    },
  );

  const canAdvance = canAdvanceFromStep(state);
  const canSubmit = canSubmitAppointmentRequest(state);

  // The polite hint is persistent while the current step is incomplete, rather than being
  // manufactured from a press of a genuinely disabled button: the live region announces
  // the change in validity, and the Continue/Submit control points at it through
  // aria-describedby.
  const hint =
    state.step === "location" && !canAdvance && state.locationOptions.length > 0
      ? getText(
          MPG_APPOINTMENT_LOCATION_HINT,
          MPGConfigTranslations,
          "appointmentLocationHint",
        )
      : state.step === "visitType" && !canAdvance
        ? getText(
            MPG_APPOINTMENT_VISIT_TYPE_HINT,
            MPGConfigTranslations,
            "appointmentVisitTypeHint",
          )
        : "";

  // PHASE 2 — request submitted. This is the ONE place the request transitions to the
  // confirmation step, so it is the single source of the `ec.purchase` that means
  // "Simulated Appointment Request Submitted" — zero revenue, no booking, no charge.
  //
  // Three guards stack, in this order: the state must actually be submittable; the latch
  // below makes a second press of this button a no-op even within one render, which is
  // what defeats a double click and an Enter key-repeat (the reducer's identical-state
  // return would stop the transition, but only AFTER the event had been emitted). The
  // latch lives in a ref on a subtree that unmounts when the dialog closes, so a genuine
  // new attempt gets a fresh one.
  //
  // Analytics runs before `dispatch` so the attempt is recorded even if a later render
  // throws, and `dispatch` sits outside the recorder's own try/catch so the dialog always
  // advances to the confirmation step. No side effect is ever placed in the reducer.
  const handleSubmit = () => {
    if (!canSubmitAppointmentRequest(state)) return;
    if (submittedRef.current) return;
    submittedRef.current = true;
    recordAppointmentSubmitted(commerceEngine, product);
    dispatch({ type: "submit" });
  };

  const stepHeading =
    state.step === "location"
      ? getText(
          MPG_APPOINTMENT_LOCATION_HEADING,
          MPGConfigTranslations,
          "appointmentLocationHeading",
        )
      : state.step === "visitType"
        ? getText(
            MPG_APPOINTMENT_VISIT_TYPE_HEADING,
            MPGConfigTranslations,
            "appointmentVisitTypeHeading",
          )
        : state.step === "review"
          ? getText(
              MPG_APPOINTMENT_REVIEW_HEADING,
              MPGConfigTranslations,
              "appointmentReviewHeading",
            )
          : getText(
              MPG_APPOINTMENT_STEP_CONFIRMATION_LABEL,
              MPGConfigTranslations,
              "appointmentStepConfirmationLabel",
            );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={TITLE_ID}
      fullWidth
      maxWidth="sm"
      sx={{
        [`& .MuiDialog-paper`]: {
          borderRadius: "16px",
          [`@media (max-width: ${Theme.mobileSize}px)`]: {
            margin: 0,
            width: "100%",
            maxWidth: "100%",
            maxHeight: "100%",
            borderRadius: 0,
          },
        },
      }}
    >
      <TitleRow>
        <DialogTitle
          id={TITLE_ID}
          sx={{ padding: 0, fontWeight: 700, fontSize: "1.25rem" }}
        >
          {getText(
            MPG_APPOINTMENT_DIALOG_TITLE,
            MPGConfigTranslations,
            "appointmentDialogTitle",
          )}
        </DialogTitle>
        <IconButton
          onClick={onClose}
          aria-label={getText(
            MPG_APPOINTMENT_DIALOG_CLOSE_LABEL,
            MPGConfigTranslations,
            "appointmentDialogCloseLabel",
          )}
          sx={{
            "&:focus-visible": {
              outline: `2px solid ${Theme.primary}`,
              outlineOffset: "2px",
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </TitleRow>

      <DialogContent sx={{ paddingTop: "8px" }}>
        {/* The Stepper duplicates the authoritative progress line below it, so it is
            hidden from assistive technology and from the narrow layout entirely. */}
        <StepperWrapper aria-hidden="true">
          <Stepper activeStep={stepIndex} alternativeLabel>
            {APPOINTMENT_STEP_ORDER.map((step) => (
              <Step key={step}>
                <StepLabel>
                  {getText(
                    STEP_LABEL_COPY[step].text,
                    MPGConfigTranslations,
                    STEP_LABEL_COPY[step].key,
                  )}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </StepperWrapper>

        <Typography variant="body2" sx={{ color: Theme.secondaryText }}>
          {progressLine}
        </Typography>

        <StepHeading step={state.step}>{stepHeading}</StepHeading>

        {state.step === "location" &&
          (state.locationOptions.length === 0 ? (
            <Unavailable>
              <Typography
                variant="subtitle2"
                component="p"
                sx={{ fontWeight: 600 }}
              >
                {getText(
                  MPG_APPOINTMENT_LOCATION_UNAVAILABLE_TITLE,
                  MPGConfigTranslations,
                  "appointmentLocationUnavailableTitle",
                )}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: Theme.secondaryText, marginTop: "6px" }}
              >
                {getText(
                  MPG_APPOINTMENT_LOCATION_UNAVAILABLE_BODY,
                  MPGConfigTranslations,
                  "appointmentLocationUnavailableBody",
                )}
              </Typography>
            </Unavailable>
          ) : (
            <AppointmentOptionGroup
              legend={getText(
                MPG_APPOINTMENT_LOCATION_GROUP_LABEL,
                MPGConfigTranslations,
                "appointmentLocationGroupLabel",
              )}
              name="appointment-location"
              options={state.locationOptions.map((location) => ({
                value: location,
                label: location,
              }))}
              value={state.selection.location}
              onChange={(location) =>
                dispatch({ type: "selectLocation", location })
              }
              describedById={HINT_ID}
            />
          ))}

        {state.step === "visitType" && (
          <>
            <AppointmentOptionGroup
              legend={getText(
                MPG_APPOINTMENT_VISIT_TYPE_GROUP_LABEL,
                MPGConfigTranslations,
                "appointmentVisitTypeGroupLabel",
              )}
              name="appointment-visit-type"
              options={state.eligibleVisitTypeKeys.map((key) => ({
                value: key,
                label: visitTypeLabel(key),
              }))}
              value={state.selection.visitTypeKey}
              onChange={(value) =>
                dispatch({
                  type: "selectVisitType",
                  visitTypeKey: value as AppointmentVisitTypeKey,
                })
              }
              describedById={HINT_ID}
            />
            <Typography
              variant="body2"
              sx={{ color: Theme.secondaryText, marginTop: "8px" }}
            >
              {getText(
                MPG_APPOINTMENT_VISIT_TYPE_DEMO_NOTE,
                MPGConfigTranslations,
                "appointmentVisitTypeDemoNote",
              )}
            </Typography>
          </>
        )}

        {state.step === "review" && (
          <AppointmentReviewStep
            providerName={providerName}
            specialtyLine={specialtyLine}
            location={state.selection.location ?? ""}
            visitTypeLabel={
              state.selection.visitTypeKey
                ? visitTypeLabel(state.selection.visitTypeKey)
                : ""
            }
          />
        )}

        {state.step === "confirmation" && (
          <AppointmentConfirmationStep
            onClose={onClose}
            discoveryPath={discoveryPath}
          />
        )}

        {/* Only rendered while a Continue or Submit control exists to describe. The
            confirmation step has neither, and its own panel is the live region there. */}
        {state.step !== "confirmation" && (
          <Hint id={HINT_ID} role="status" aria-live="polite">
            {hint}
          </Hint>
        )}
      </DialogContent>

      {state.step !== "confirmation" && (
        <DialogActions sx={{ padding: "0 24px 20px", gap: "12px" }}>
          <Button
            variant="text"
            onClick={onClose}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              color: Theme.secondaryText,
              marginRight: "auto",
              "&:focus-visible": {
                outline: `2px solid ${Theme.primary}`,
                outlineOffset: "2px",
              },
            }}
          >
            {getText(
              MPG_APPOINTMENT_CANCEL_LABEL,
              MPGConfigTranslations,
              "appointmentCancelLabel",
            )}
          </Button>

          {state.step !== "location" && (
            <Button
              variant="outlined"
              onClick={() => dispatch({ type: "back" })}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                "&:focus-visible": {
                  outline: `2px solid ${Theme.primary}`,
                  outlineOffset: "2px",
                },
              }}
            >
              {getText(
                MPG_APPOINTMENT_BACK_LABEL,
                MPGConfigTranslations,
                "appointmentBackLabel",
              )}
            </Button>
          )}

          {state.step === "review" ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!canSubmit}
              aria-disabled={!canSubmit ? true : undefined}
              aria-describedby={HINT_ID}
              sx={primaryActionSx}
            >
              {getText(
                MPG_APPOINTMENT_SUBMIT_LABEL,
                MPGConfigTranslations,
                "appointmentSubmitLabel",
              )}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => dispatch({ type: "next" })}
              disabled={!canAdvance}
              aria-disabled={!canAdvance ? true : undefined}
              aria-describedby={HINT_ID}
              sx={primaryActionSx}
            >
              {getText(
                MPG_APPOINTMENT_CONTINUE_LABEL,
                MPGConfigTranslations,
                "appointmentContinueLabel",
              )}
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default AppointmentRequestDialog;

// The active step's heading, which takes focus whenever the step changes so a keyboard or
// screen-reader user lands on the step they are on rather than on the dialog container.
//
// It is its own component on purpose: MUI's Portal attaches the dialog content in a later
// commit than the one that opens it, so an effect owned by the dialog shell would run
// while this heading's ref was still null. Owning the effect here means it runs on the
// commit that actually mounts the heading, and — being deeper in the tree than MUI's
// focus trap — it runs before the trap would otherwise focus the container.
//
// It calls `.focus()` only: no state, no dispatch, so it cannot update during render.
const StepHeading: FunctionComponent<{
  step: AppointmentStep;
  children: ReactNode;
}> = (props) => {
  const { step, children } = props;
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  return (
    <Typography
      variant="subtitle1"
      component="h3"
      ref={headingRef}
      tabIndex={-1}
      sx={{
        fontWeight: 700,
        margin: "8px 0 16px",
        "&:focus-visible": {
          outline: `2px solid ${Theme.primary}`,
          outlineOffset: "2px",
        },
      }}
    >
      {children}
    </Typography>
  );
};

const primaryActionSx = {
  borderRadius: "12px",
  textTransform: "none",
  background: Theme.button,
  color: Theme.buttonText,
  "&:hover": { background: Theme.primary },
  "&:focus-visible": {
    outline: `2px solid ${Theme.primary}`,
    outlineOffset: "2px",
  },
};

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 24px 0;
`;

const StepperWrapper = styled.div`
  margin-bottom: 16px;

  @media (max-width: ${Theme.mobileSize}px) {
    display: none;
  }
`;

const Unavailable = styled.div`
  padding: 16px;
  border: 1px #e5e8e8 solid;
  border-radius: 12px;
  background: #ffffff;
`;

const Hint = styled.div`
  min-height: 20px;
  margin-top: 12px;
  color: ${Theme.secondaryText};
  font-size: 0.875rem;
`;
