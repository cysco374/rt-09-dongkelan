import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  FasilitasData,
  IuranData,
  KKData,
  PengumumanData,
  PengurusData,
  Statistics,
  Status,
  StatusWarga,
  Status__2,
  SuratData,
  WargaData,
  WebsiteSettings,
} from "../backend.d";
import { useActor } from "./useActor";

// --- Statistics ---
export function useStatistics() {
  const { actor, isFetching } = useActor();
  return useQuery<Statistics>({
    queryKey: ["statistics"],
    queryFn: async () => {
      if (!actor)
        return {
          totalActivePengumuman: BigInt(0),
          totalKK: BigInt(0),
          totalWaitingSurat: BigInt(0),
          totalPaidIuranThisMonth: BigInt(0),
          totalWarga: BigInt(0),
        };
      return actor.getStatistics();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

// --- Website Settings ---
export function useWebsiteSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<WebsiteSettings | null>({
    queryKey: ["websiteSettings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getWebsiteSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetWebsiteSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: WebsiteSettings) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setWebsiteSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websiteSettings"] });
    },
  });
}

// --- Warga ---
export function useListWarga() {
  const { actor, isFetching } = useActor();
  return useQuery<WargaData[]>({
    queryKey: ["warga"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listWarga();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddWarga() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: WargaData) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addWarga(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warga"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}

export function useUpdateWarga() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: WargaData) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateWarga(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warga"] });
    },
  });
}

export function useDeleteWarga() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteWarga(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warga"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}

export function useFilterWargaByStatus(status: StatusWarga | null) {
  const { actor, isFetching } = useActor();
  return useQuery<WargaData[]>({
    queryKey: ["warga", "status", status],
    queryFn: async () => {
      if (!actor || !status) return [];
      return actor.filterWargaByStatus(status);
    },
    enabled: !!actor && !isFetching && !!status,
  });
}

// --- KK ---
export function useListKK() {
  const { actor, isFetching } = useActor();
  return useQuery<KKData[]>({
    queryKey: ["kk"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listKK();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddKK() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: KKData) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addKK(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kk"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}

export function useUpdateKK() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: KKData) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateKK(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kk"] });
    },
  });
}

export function useDeleteKK() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteKK(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kk"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}

// --- Pengumuman ---
export function useListPengumuman() {
  const { actor, isFetching } = useActor();
  return useQuery<PengumumanData[]>({
    queryKey: ["pengumuman"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPengumuman();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListActivePengumuman() {
  const { actor, isFetching } = useActor();
  return useQuery<PengumumanData[]>({
    queryKey: ["pengumuman", "active"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listActivePengumuman();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useAddPengumuman() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PengumumanData) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addPengumuman(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pengumuman"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}

export function useUpdatePengumuman() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PengumumanData) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updatePengumuman(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pengumuman"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}

export function useDeletePengumuman() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deletePengumuman(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pengumuman"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}

// --- Iuran ---
export function useListIuran() {
  const { actor, isFetching } = useActor();
  return useQuery<IuranData[]>({
    queryKey: ["iuran"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listIuran();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddIuran() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: IuranData) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addIuran(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iuran"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}

export function useUpdateIuran() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: IuranData) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateIuran(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iuran"] });
    },
  });
}

export function useDeleteIuran() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteIuran(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iuran"] });
    },
  });
}

// --- Surat ---
export function useListSurat() {
  const { actor, isFetching } = useActor();
  return useQuery<SuratData[]>({
    queryKey: ["surat"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSurat();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddSurat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SuratData) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addSurat(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surat"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}

export function useUpdateSurat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SuratData) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateSurat(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surat"] });
    },
  });
}

export function useDeleteSurat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteSurat(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surat"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}

export function useFilterSuratByStatus(status: Status | null) {
  const { actor, isFetching } = useActor();
  return useQuery<SuratData[]>({
    queryKey: ["surat", "status", status],
    queryFn: async () => {
      if (!actor || !status) return [];
      return actor.filterSuratByStatus(status);
    },
    enabled: !!actor && !isFetching && !!status,
  });
}

// --- Pengurus ---
export function useListPengurus() {
  const { actor, isFetching } = useActor();
  return useQuery<PengurusData[]>({
    queryKey: ["pengurus"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPengurus();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useAddPengurus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PengurusData) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addPengurus(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pengurus"] });
    },
  });
}

export function useUpdatePengurus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PengurusData) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updatePengurus(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pengurus"] });
    },
  });
}

export function useDeletePengurus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deletePengurus(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pengurus"] });
    },
  });
}

// --- Fasilitas ---
export function useListFasilitas() {
  const { actor, isFetching } = useActor();
  return useQuery<FasilitasData[]>({
    queryKey: ["fasilitas"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFasilitas();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddFasilitas() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FasilitasData) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addFasilitas(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fasilitas"] });
    },
  });
}

export function useUpdateFasilitas() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FasilitasData) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateFasilitas(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fasilitas"] });
    },
  });
}

export function useDeleteFasilitas() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteFasilitas(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fasilitas"] });
    },
  });
}

// --- Admin Credentials ---
export function useSetAdminCredentials() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: ({
      username,
      passwordHash,
      currentPasswordHash,
    }: {
      username: string;
      passwordHash: string;
      currentPasswordHash: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setAdminCredentials(
        username,
        passwordHash,
        currentPasswordHash,
      );
    },
  });
}

// --- Filter Iuran ---
export function useFilterIuranByMonthYear(
  month: number | null,
  year: number | null,
) {
  const { actor, isFetching } = useActor();
  return useQuery<IuranData[]>({
    queryKey: ["iuran", "filter", month, year],
    queryFn: async () => {
      if (!actor || month === null || year === null) return [];
      return actor.filterIuranByMonthYear(BigInt(month), BigInt(year));
    },
    enabled: !!actor && !isFetching && month !== null && year !== null,
  });
}

export function useFilterIuranByStatus(status: Status__2 | null) {
  const { actor, isFetching } = useActor();
  return useQuery<IuranData[]>({
    queryKey: ["iuran", "status", status],
    queryFn: async () => {
      if (!actor || !status) return [];
      return actor.filterIuranByStatus(status);
    },
    enabled: !!actor && !isFetching && !!status,
  });
}
