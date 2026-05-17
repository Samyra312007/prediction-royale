"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { readContract } from "wagmi/actions";
import { config } from "@/app/wagmi";
import { CONTRACT_ADDRESSES, OracleAdapterABI } from "@/lib/contracts";

const ORACLE_DECIMALS = 8;
const POLL_INTERVAL = 15_000;

interface BTCPriceState {
  price: number | null;
  formattedPrice: string;
  updatedAt: Date | null;
  change24h: number | null;
  isLoading: boolean;
  error: string | null;
}

export function useBTCPrice() {
  const [state, setState] = useState<BTCPriceState>({
    price: null,
    formattedPrice: "---",
    updatedAt: null,
    change24h: null,
    isLoading: true,
    error: null,
  });
  const prevPrice = useRef<number | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      const result = (await readContract(config, {
        address: CONTRACT_ADDRESSES.oracleAdapter,
        abi: OracleAdapterABI,
        functionName: "getLatestPrice",
      })) as [bigint, bigint];

      const rawPrice = Number(result[0]);
      const timestamp = Number(result[1]) * 1000;
      const price = rawPrice / 10 ** ORACLE_DECIMALS;

      let change24h: number | null = null;
      if (prevPrice.current !== null) {
        change24h = ((price - prevPrice.current) / prevPrice.current) * 100;
      }
      prevPrice.current = price;

      setState({
        price,
        formattedPrice: price.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        updatedAt: new Date(timestamp),
        change24h,
        isLoading: false,
        error: null,
      });
    } catch (e) {
      console.error("useBTCPrice fetch error:", e);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to fetch BTC price",
      }));
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return state;
}
