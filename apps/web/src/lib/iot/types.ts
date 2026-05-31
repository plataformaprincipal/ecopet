export type IoTDeviceType = "collar" | "camera" | "feeder" | "water" | "scale" | "health" | "tracker" | "sensor";

export interface IoTDevice {
  id: string;
  name: string;
  type: IoTDeviceType;
  petName: string;
  status: "online" | "offline" | "warning";
  battery: number;
  location: string;
  lastSync: string;
  alerts: number;
  metrics: Record<string, string | number | boolean>;
}
