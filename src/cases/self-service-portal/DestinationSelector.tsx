import type { ReactNode } from "react";
import { DESTINATIONS, type Destination } from "@/cases/self-service-portal/destinations";
import { withFieldGroup } from "@/cases/self-service-portal/useForm";

// Declared as a typed empty default rather than a cast. onSwitch lets the form
// run extra work once the destination changes; legendHelp slots a help button
// beside the legend without coupling this component to the copy.
const selectorProps: {
  onSwitch?: (destination: Destination) => void;
  legendHelp?: ReactNode;
} = {};

const CCSM_CONFIRM =
  "CCSM provisions under the Secure Projects tree with private visibility. " +
  "Make sure you know what you are doing.";

/** The three-way destination selector. A repo lives in exactly one tree, so this
    is a single enum rather than a stack of booleans. Choosing CCSM asks for
    confirmation, since it moves provisioning into the private tree. */
export const DestinationSelector = withFieldGroup({
  defaultValues: { destination: "project" as Destination },
  props: selectorProps,
  render: ({ group, onSwitch, legendHelp }) => (
    <group.AppField name="destination">
      {(field) => (
        <fieldset className="ssp-destination-selector">
          <legend>
            Destination
            {legendHelp}
          </legend>
          {DESTINATIONS.map(({ value, label }) => (
            <label key={value} htmlFor={`ssp-destination-${value}`}>
              <input
                type="radio"
                id={`ssp-destination-${value}`}
                name="ssp-destination"
                value={value}
                checked={field.state.value === value}
                onChange={() => {
                  if (value === "ccsm" && !window.confirm(CCSM_CONFIRM)) return;
                  field.handleChange(value);
                  onSwitch?.(value);
                }}
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
      )}
    </group.AppField>
  ),
});
