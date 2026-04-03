export interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}

export interface NetworkListener {
  callback: (status: NetworkStatus) => void;
  remove: () => Promise<void>;
}

export interface INetworkProvider {
  getStatus(): Promise<NetworkStatus>;
  addListener(
    callback: (status: NetworkStatus) => void,
  ): Promise<NetworkListener>;
  removeListener(listener: NetworkListener): Promise<void>;
}
