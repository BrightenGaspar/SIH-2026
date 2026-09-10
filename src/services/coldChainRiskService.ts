import { ColdChainRiskResult, ColdChainAlert, RiskLevel } from '@/types/intelligence';
import { getCropColdChainProfile } from '@/config/cropThresholds';

export function assessColdChainRisk(
  crop: string,
  currentTemp: number = 14.8,
  currentHumidity: number = 88.0,
  hoursInTransit: number = 18,
  shipmentId: string = 'TRK-2026-HYD-441'
): ColdChainRiskResult {
  const profile = getCropColdChainProfile(crop);
  const alerts: ColdChainAlert[] = [];

  // Temperature deviation
  let tempDeviation = 0;
  if (currentTemp > profile.maxTempCelsius) {
    tempDeviation = Number((currentTemp - profile.maxTempCelsius).toFixed(1));
  } else if (currentTemp < profile.minTempCelsius) {
    tempDeviation = Number((profile.minTempCelsius - currentTemp).toFixed(1));
  }

  // Humidity deviation
  let humidityDeviation = 0;
  if (currentHumidity < profile.minHumidityPercent) {
    humidityDeviation = profile.minHumidityPercent - currentHumidity;
  } else if (currentHumidity > profile.maxHumidityPercent) {
    humidityDeviation = currentHumidity - profile.maxHumidityPercent;
  }

  // Risk Score calculation (0 - 100)
  // Temp deviation is heavily weighted (each degree out of range = ~15 points)
  let riskScore = Math.min(100, Math.round(
    (tempDeviation * 15) + 
    (humidityDeviation * 1.5) + 
    (Math.max(0, hoursInTransit - profile.maxSafeTransitHours * 0.5) * 1.2)
  ));

  let riskLevel: RiskLevel = 'LOW';
  let reeferStatus: 'OPTIMAL' | 'COMPRESSOR_CYCLING' | 'COOLING_FAILURE' | 'DEFROST_CYCLE' = 'OPTIMAL';
  let recommendedAction = 'Reefer operating in optimal thermal window. No intervention required.';

  if (tempDeviation >= 4.0) {
    riskLevel = 'CRITICAL';
    reeferStatus = 'COOLING_FAILURE';
    recommendedAction = 'CRITICAL WARNING: Temperature breach >4°C. Instruct driver to pull over at nearest cold point or inspect secondary generator compressor.';
    alerts.push({
      id: 'alert-temp-crit',
      severity: 'CRITICAL',
      sensor: 'TEMPERATURE',
      title: 'Severe Reefer Thermal Excursion',
      message: Cargo temp at °C exceeds max safe limit (°C) by °C.,
      timeDetected: '12 mins ago',
      suggestedAction: 'Immediate compressor diagnostic & redirect to emergency cold hub.',
    });
  } else if (tempDeviation >= 1.5) {
    riskLevel = 'HIGH';
    reeferStatus = 'COMPRESSOR_CYCLING';
    recommendedAction = 'Cargo temperature elevated. Check air return vents and verify vehicle insulation seals.';
    alerts.push({
      id: 'alert-temp-high',
      severity: 'HIGH',
      sensor: 'TEMPERATURE',
      title: 'Elevated Cargo Temperature',
      message: Reefer temperature (°C) is above optimal threshold (°C).,
      timeDetected: '24 mins ago',
      suggestedAction: 'Increase reefer cooling throttle to preset setpoint 12.0°C.',
    });
  } else if (riskScore > 35) {
    riskLevel = 'MEDIUM';
    recommendedAction = 'Minor environmental drift detected. Monitor telemetry at next toll plaza.';
  }

  const shelfLifeLossHours = Math.round((riskScore / 100) * 36);

  return {
    shipmentId,
    crop,
    currentTempCelsius: currentTemp,
    safeTempRange: { min: profile.minTempCelsius, max: profile.maxTempCelsius },
    currentHumidityPercent: currentHumidity,
    safeHumidityRange: { min: profile.minHumidityPercent, max: profile.maxHumidityPercent },
    tempDeviationDegrees: tempDeviation,
    hoursOutOfRange: tempDeviation > 0 ? 3.5 : 0,
    riskScore,
    riskLevel,
    predictedShelfLifeLossHours: shelfLifeLossHours,
    alerts,
    recommendedAction,
    reeferStatus,
  };
}
