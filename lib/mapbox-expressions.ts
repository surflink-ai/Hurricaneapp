import type { ExpressionSpecification } from "mapbox-gl";
import { CAT_COLORS } from "./saffir";

export function categoryColorExpression(field: string): ExpressionSpecification {
  return [
    "match",
    ["get", field],
    "c5", CAT_COLORS.c5,
    "c4", CAT_COLORS.c4,
    "c3", CAT_COLORS.c3,
    "c2", CAT_COLORS.c2,
    "c1", CAT_COLORS.c1,
    "ts", CAT_COLORS.ts,
    CAT_COLORS.sub
  ];
}

export function dimmedOpacityExpression(
  selectedOpacity: number,
  dimmedOpacity: number,
  defaultOpacity: number
): ExpressionSpecification {
  return [
    "case",
    ["boolean", ["feature-state", "selected"], false], selectedOpacity,
    ["boolean", ["feature-state", "dimmed"], false], dimmedOpacity,
    ["boolean", ["feature-state", "essay"], false], 0.95,
    defaultOpacity
  ];
}

export function lineWidthExpression(
  selectedWidth: number,
  defaultWidth: number
): ExpressionSpecification {
  return [
    "case",
    ["boolean", ["feature-state", "selected"], false], selectedWidth,
    ["boolean", ["feature-state", "essay"], false], selectedWidth,
    defaultWidth
  ];
}

export function landfallStrokeExpression(): ExpressionSpecification {
  return [
    "case",
    ["==", ["get", "recordId"], "L"], 2.4,
    0.6
  ];
}

export function landfallStrokeColorExpression(): ExpressionSpecification {
  return [
    "case",
    ["==", ["get", "recordId"], "L"], "#0a0a08",
    "rgba(10,10,8,0.45)"
  ];
}
