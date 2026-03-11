export interface KKData {
    id: string;
    members: Array<string>;
    head: string;
    createdAt: bigint;
    address: string;
    number: string;
}
export interface Statistics {
    totalActivePengumuman: bigint;
    totalKK: bigint;
    totalWaitingSurat: bigint;
    totalPaidIuranThisMonth: bigint;
    totalWarga: bigint;
}
export interface WargaData {
    id: string;
    dob: string;
    job: string;
    nik: string;
    status: StatusWarga;
    kkNumber: string;
    createdAt: bigint;
    fullName: string;
    address: string;
    gender: Gender;
    phone: string;
    maritalStatus: string;
}
export interface IuranData {
    id: string;
    wargaId: string;
    status: Status__2;
    month: bigint;
    total: bigint;
    createdAt: bigint;
    year: bigint;
    wargaName: string;
    iuranType: Type__1;
    paymentDate?: string;
}
export interface SuratData {
    id: string;
    wargaId: string;
    status: Status;
    applicant: string;
    completionDate?: string;
    suratType: Type;
    createdAt: bigint;
    notes?: string;
    requestDate: string;
    purpose: string;
}
export interface PengurusData {
    id: string;
    period: string;
    name: string;
    createdAt: bigint;
    phone: string;
    photo: string;
    position: string;
}
export interface FasilitasData {
    id: string;
    acquisitionYear: bigint;
    name: string;
    createdAt: bigint;
    description: string;
    location: string;
    fasilitasType: Type__2;
    condition: Condition;
}
export interface PengumumanData {
    id: string;
    status: Status__1;
    title: string;
    content: string;
    date: string;
    createdAt: bigint;
    author: string;
    category: Category;
}
export interface WebsiteSettings {
    mission: string;
    name: string;
    headPhone: string;
    description: string;
    history: string;
    email: string;
    fullAddress: string;
    vision: string;
}
export enum Category {
    emergency = "emergency",
    important = "important",
    general = "general"
}
export enum Condition {
    good = "good",
    heavyDamage = "heavyDamage",
    lightDamage = "lightDamage"
}
export enum Gender {
    female = "female",
    male = "male"
}
export enum Status {
    finished = "finished",
    rejected = "rejected",
    processing = "processing",
    waiting = "waiting"
}
export enum StatusWarga {
    kos = "kos",
    tetap = "tetap",
    kontrak = "kontrak"
}
export enum Status__1 {
    active = "active",
    archived = "archived"
}
export enum Status__2 {
    paid = "paid",
    unpaid = "unpaid"
}
export enum Type {
    kk = "kk",
    ktp = "ktp",
    other = "other",
    poor = "poor",
    domicile = "domicile"
}
export enum Type__1 {
    social = "social",
    cleaning = "cleaning",
    security = "security",
    monthly = "monthly"
}
export enum Type__2 {
    other = "other",
    equipment = "equipment",
    building = "building",
    vehicle = "vehicle"
}
export interface backendInterface {
    addFasilitas(fasilitasData: FasilitasData): Promise<string>;
    addIuran(iuranData: IuranData): Promise<string>;
    addKK(kkData: KKData): Promise<string>;
    addPengumuman(pengumumanData: PengumumanData): Promise<string>;
    addPengurus(pengurusData: PengurusData): Promise<string>;
    addSurat(suratData: SuratData): Promise<string>;
    addWarga(wargaData: WargaData): Promise<string>;
    deleteFasilitas(id: string): Promise<void>;
    deleteIuran(id: string): Promise<void>;
    deleteKK(id: string): Promise<void>;
    deletePengumuman(id: string): Promise<void>;
    deletePengurus(id: string): Promise<void>;
    deleteSurat(id: string): Promise<void>;
    deleteWarga(id: string): Promise<void>;
    filterIuranByMonthYear(month: bigint, year: bigint): Promise<Array<IuranData>>;
    filterIuranByStatus(status: Status__2): Promise<Array<IuranData>>;
    filterIuranByWarga(wargaId: string): Promise<Array<IuranData>>;
    filterSuratByStatus(status: Status): Promise<Array<SuratData>>;
    filterSuratByWarga(wargaId: string): Promise<Array<SuratData>>;
    filterWargaByKK(kkNumber: string): Promise<Array<WargaData>>;
    filterWargaByStatus(status: StatusWarga): Promise<Array<WargaData>>;
    getAdminUsername(): Promise<string>;
    getFasilitas(id: string): Promise<FasilitasData | null>;
    getIuran(id: string): Promise<IuranData | null>;
    getKK(id: string): Promise<KKData | null>;
    getPengumuman(id: string): Promise<PengumumanData | null>;
    getPengurus(id: string): Promise<PengurusData | null>;
    getStatistics(): Promise<Statistics>;
    getSurat(id: string): Promise<SuratData | null>;
    getWarga(id: string): Promise<WargaData | null>;
    getWebsiteSettings(): Promise<WebsiteSettings | null>;
    listActivePengumuman(): Promise<Array<PengumumanData>>;
    listFasilitas(): Promise<Array<FasilitasData>>;
    listIuran(): Promise<Array<IuranData>>;
    listKK(): Promise<Array<KKData>>;
    listPengumuman(): Promise<Array<PengumumanData>>;
    listPengurus(): Promise<Array<PengurusData>>;
    listSurat(): Promise<Array<SuratData>>;
    listWarga(): Promise<Array<WargaData>>;
    setAdminCredentials(username: string, passwordHash: string, currentPasswordHash: string): Promise<boolean>;
    setWebsiteSettings(settings: WebsiteSettings): Promise<void>;
    updateFasilitas(updatedFasilitas: FasilitasData): Promise<void>;
    updateIuran(updatedIuran: IuranData): Promise<void>;
    updateKK(updatedKK: KKData): Promise<void>;
    updatePengumuman(updatedPengumuman: PengumumanData): Promise<void>;
    updatePengurus(updatedPengurus: PengurusData): Promise<void>;
    updateSurat(updatedSurat: SuratData): Promise<void>;
    updateWarga(updatedWarga: WargaData): Promise<void>;
    verifyAdminCredentials(username: string, passwordHash: string): Promise<boolean>;
}
