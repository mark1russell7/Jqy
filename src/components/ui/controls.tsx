import { 
  JSX 
} from "react";

/* ---------- Segmented (general) ---------- */
export type SelectionProps<T> = 
{
    label     : string;
    options   : SelectOption<T>[];
    onChange  : (v : T) => void;
    value     : T;
}
export function Segmented<T>(
                                {
                                    label,
                                    options,
                                    onChange,
                                    value
                                } : SelectionProps<T>
                            ) : JSX.Element 
{
    const labelToValue = new Map<string, T>(options.map((o : SelectOption<T>) : [string, T] => [o.label, o.value]));
    const valueToLabel = new Map<T, string>(options.map((o : SelectOption<T>) : [T, string] => [o.value, o.label]));

    const OuterStyle : React.CSSProperties = 
    {
        display     : "inline-flex",
        alignItems  : "center",
        gap         : 8,
        marginRight : 12
    };
    const OuterLabelStyle : React.CSSProperties =
    {
        fontSize : 12
    }
    const TabListStyle : React.CSSProperties =
    {
        display       : "inline-flex",
        border        : "1px solid #d0d7de",
        borderRadius  : 8,
        overflow      : "hidden"
    };

    const OptionStyle = (o : SelectOption<T>, selected : boolean) : React.CSSProperties =>
    {
        return {
            padding      : "6px 10px",
            fontSize     : 12,
            border       : "none",
            background   : selected ? "#111827" : "#fff",
            color        : selected ? "#fff" : "#111827",
            cursor       : o.disabled ? "not-allowed" : "pointer",
            opacity      : o.disabled ? 0.5 : 1,
        };
    };

    return (
        <div style = {OuterStyle}>
            <span style = {OuterLabelStyle}>
                {label}
            </span>
            <div
                role        =   "tablist"
                aria-label  =   {label          }
                style       =   {TabListStyle   }
            >
                {
                    options.map (
                                    (o : SelectOption<T>) : JSX.Element => 
                                    {
                                        const selected : boolean = value === o.value;
                                        return (
                                            <button
                                                key             =   {o.label + Math.random().toString(16)   }
                                                role            =   "tab"
                                                aria-selected   =   {selected                               }
                                                disabled        =   {o.disabled                             }
                                                onClick         =   {() => onChange(o.value)                }
                                                style           =   {OptionStyle(o, selected)               }
                                            >
                                                {o.label}
                                            </button>
                                        );
                                    }
                    )
                }
            </div>
        </div>
    );
}

/* ---------- Select (keep for node scope) ---------- */
export type SelectOption<T> =
{
    label     : string;
    value     : T;
    disabled? : boolean;
}
export function Select<T>   (
                                {
                                    label, 
                                    onChange, 
                                    options, 
                                    value
                                } : SelectionProps<T>
                            ) : JSX.Element 
{
    const labelToValue : Map<string, T> = new Map<string, T>(options.map((o : SelectOption<T>) : [string, T] => [o.label, o.value]));
    const valueToLabel : Map<T, string> = new Map<T, string>(options.map((o : SelectOption<T>) : [T, string] => [o.value, o.label]));
    
    const OuterStyle : React.CSSProperties =
    {
        display       : "inline-flex",
        alignItems    : "center",
        marginRight   : 12
    };

    const OuterLabelStyle : React.CSSProperties =
    {
        marginRight   : 8,
        fontSize      : 12
    };

    const SelectOnChange =  (
                                e : React.ChangeEvent<HTMLSelectElement>
                            ) : void =>
    {
        onChange(labelToValue.get(e.target.value)!);
    };

    return (
        <div style = {OuterStyle}>
            <label style = {OuterLabelStyle}>
                {label}
            </label>
            <select 
                value       =   {valueToLabel.get(value)!   } 
                onChange    =   {SelectOnChange             }
            >
                {
                    options
                        .map(   
                                (
                                    o : SelectOption<T>
                                ) : JSX.Element => 
                                    (
                                        <option 
                                            key         =   {o.label + Math.random().toString(16)} 
                                            value       =   {o.label} 
                                            disabled    =   {o.disabled}
                                        >
                                            {o.label}
                                        </option>
                                    )
                        )
                }
            </select>
        </div>
    );
}

/* ---------- Slider ---------- */

export type LabeledSliderProps = 
    SelectionProps<number> 
&   {
        min         : number;
        max         : number;
        step?       : number;
        disabled?   : boolean;
    };

export const LabeledSlider =    (
                                    {
                                        label, 
                                        value, 
                                        min, 
                                        max, 
                                        step = 1, 
                                        onChange, 
                                        disabled = false
                                    } : LabeledSliderProps
                                ) : JSX.Element => 
{
    const OuterStyle : React.CSSProperties =
    {
        display       : "inline-flex",
        alignItems    : "center",
        margin        : "0 12px",
        opacity       : disabled ? 0.5 : 1
    };
    const OuterLabelStyle : React.CSSProperties =
    {
        marginRight   : 8,
        fontSize      : 12
    };
    const InnerStyle : React.CSSProperties =
    {
        marginLeft    : 8,
        fontSize      : 12
    };

    const OnChange =    (
                            e : React.ChangeEvent<HTMLInputElement>
                        ) : void => 
    {
        onChange(parseInt(e.target.value, 10));
    };
    return  (
                <div style = {OuterStyle}>
                    <label style = {OuterLabelStyle}>
                        {label}
                    </label>
                    <input
                        type        =   "range" 
                        min         =   {min        } 
                        max         =   {max        } 
                        step        =   {step       } 
                        value       =   {value      } 
                        disabled    =   {disabled   }
                        onChange    =   {OnChange   }
                    />
                    <span style = {InnerStyle}>
                        {value}
                    </span>
                </div>
            );
}
