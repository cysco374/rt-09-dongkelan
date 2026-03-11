import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";



actor {
  // Migration: explicitly drop stable variables from previous version
  // that used Internet Identity authorization (no longer needed)
  type OldUserRole = { #admin; #user; #guest };
  type OldUserProfile = { name : Text; role : Text };
  type OldAccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, OldUserRole>;
  };

  stable var accessControlState : OldAccessControlState = {
    var adminAssigned = false;
    userRoles = Map.empty<Principal, OldUserRole>();
  };
  stable var userProfiles = Map.empty<Principal, OldUserProfile>();

  system func postupgrade() {
    // Drop old authorization state - no longer needed
    accessControlState := {
      var adminAssigned = false;
      userRoles = Map.empty<Principal, OldUserRole>();
    };
    userProfiles := Map.empty<Principal, OldUserProfile>();
  };

  // Types
  module Warga {
    public type Gender = {
      #male;
      #female;
    };

    public type StatusWarga = {
      #tetap;
      #kontrak;
      #kos;
    };

    public type WargaData = {
      id : Text;
      nik : Text;
      fullName : Text;
      dob : Text; // YYYY-MM-DD
      gender : Gender;
      address : Text;
      phone : Text;
      status : StatusWarga;
      kkNumber : Text;
      maritalStatus : Text;
      job : Text;
      createdAt : Time.Time;
    };
  };

  module KK {
    public type KKData = {
      id : Text;
      number : Text;
      head : Text;
      address : Text;
      members : [Text]; // Ids of WargaData
      createdAt : Time.Time;
    };
  };

  module Pengumuman {
    public type Status = {
      #active;
      #archived;
    };

    public type Category = {
      #general;
      #important;
      #emergency;
    };

    public type PengumumanData = {
      id : Text;
      title : Text;
      content : Text;
      category : Category;
      date : Text;
      status : Status;
      author : Text;
      createdAt : Time.Time;
    };
  };

  module Iuran {
    public type Status = {
      #paid;
      #unpaid;
    };

    public type Type = {
      #monthly;
      #security;
      #cleaning;
      #social;
    };

    public type IuranData = {
      id : Text;
      wargaId : Text;
      wargaName : Text;
      iuranType : Type;
      month : Nat;
      year : Nat;
      total : Nat;
      status : Status;
      paymentDate : ?Text;
      createdAt : Time.Time;
    };
  };

  module Surat {
    public type Status = {
      #waiting;
      #processing;
      #finished;
      #rejected;
    };

    public type Type = {
      #domicile;
      #poor;
      #ktp;
      #kk;
      #other;
    };

    public type SuratData = {
      id : Text;
      wargaId : Text;
      applicant : Text;
      suratType : Type;
      purpose : Text;
      status : Status;
      requestDate : Text;
      completionDate : ?Text;
      notes : ?Text;
      createdAt : Time.Time;
    };
  };

  module Fasilitas {
    public type Type = {
      #building;
      #equipment;
      #vehicle;
      #other;
    };

    public type Condition = {
      #good;
      #lightDamage;
      #heavyDamage;
    };

    public type FasilitasData = {
      id : Text;
      name : Text;
      fasilitasType : Type;
      condition : Condition;
      location : Text;
      acquisitionYear : Nat;
      description : Text;
      createdAt : Time.Time;
    };
  };

  module Pengurus {
    public type PengurusData = {
      id : Text;
      name : Text;
      position : Text;
      phone : Text;
      period : Text;
      photo : Text;
      createdAt : Time.Time;
    };
  };

  module Website {
    public type WebsiteSettings = {
      name : Text;
      description : Text;
      fullAddress : Text;
      headPhone : Text;
      email : Text;
      vision : Text;
      mission : Text;
      history : Text;
    };
  };

  public type Statistics = {
    totalWarga : Nat;
    totalKK : Nat;
    totalActivePengumuman : Nat;
    totalWaitingSurat : Nat;
    totalPaidIuranThisMonth : Nat;
  };

  public type AdminCredentials = {
    username : Text;
    passwordHash : Text;
  };

  // State
  let warga = Map.empty<Text, Warga.WargaData>();
  let kks = Map.empty<Text, KK.KKData>();
  let pengumuman = Map.empty<Text, Pengumuman.PengumumanData>();
  let iuran = Map.empty<Text, Iuran.IuranData>();
  let surat = Map.empty<Text, Surat.SuratData>();
  let fasilitas = Map.empty<Text, Fasilitas.FasilitasData>();
  let pengurus = Map.empty<Text, Pengurus.PengurusData>();
  let websiteSettings = Map.empty<Text, Website.WebsiteSettings>();
  let ids = Set.empty<Text>();

  // Admin Credentials State
  // Default password hash for "admin" using SHA-256
  var adminCredentials : AdminCredentials = {
    username = "admin";
    passwordHash = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";
  };

  // Admin Credentials Management - public so frontend can call without Internet Identity
  public shared func setAdminCredentials(
    username : Text,
    passwordHash : Text,
    currentPasswordHash : Text,
  ) : async Bool {
    // Verify current password before changing
    if (adminCredentials.passwordHash != currentPasswordHash) {
      return false;
    };
    adminCredentials := {
      username;
      passwordHash;
    };
    true;
  };

  // Public - no Internet Identity required for username/password login
  public query func verifyAdminCredentials(
    username : Text,
    passwordHash : Text,
  ) : async Bool {
    adminCredentials.username == username and adminCredentials.passwordHash == passwordHash
  };

  public query func getAdminUsername() : async Text {
    adminCredentials.username;
  };

  // General utils
  func getCurrentTime() : Time.Time {
    Time.now();
  };

  func generateId(prefix : Text) : Text {
    let timestamp = Time.now().toText();
    let newId = prefix # timestamp;
    if (ids.contains(newId)) { Runtime.trap("ID already exists") };
    ids.add(newId);
    newId;
  };

  // Warga CRUD - No auth check, frontend session handles auth
  public shared func addWarga(wargaData : Warga.WargaData) : async Text {
    let id = generateId("warga_");
    let newWarga = { wargaData with id; createdAt = getCurrentTime() };
    warga.add(id, newWarga);
    id;
  };

  public query func getWarga(id : Text) : async ?Warga.WargaData {
    warga.get(id);
  };

  public query func listWarga() : async [Warga.WargaData] {
    warga.values().toArray();
  };

  public query func filterWargaByStatus(status : Warga.StatusWarga) : async [Warga.WargaData] {
    let filtered = warga.values().filter(
      func(w) { w.status == status }
    );
    filtered.toArray();
  };

  public query func filterWargaByKK(kkNumber : Text) : async [Warga.WargaData] {
    let filtered = warga.values().filter(
      func(w) { w.kkNumber == kkNumber }
    );
    filtered.toArray();
  };

  public shared func updateWarga(updatedWarga : Warga.WargaData) : async () {
    if (not warga.containsKey(updatedWarga.id)) { Runtime.trap("Data tidak ditemukan") };
    warga.add(updatedWarga.id, updatedWarga);
  };

  public shared func deleteWarga(id : Text) : async () {
    if (not warga.containsKey(id)) { Runtime.trap("Data tidak ditemukan") };
    warga.remove(id);
  };

  // KK CRUD
  public shared func addKK(kkData : KK.KKData) : async Text {
    let id = generateId("kk_");
    let newKK = { kkData with id; createdAt = getCurrentTime() };
    kks.add(id, newKK);
    id;
  };

  public query func getKK(id : Text) : async ?KK.KKData {
    kks.get(id);
  };

  public query func listKK() : async [KK.KKData] {
    kks.values().toArray();
  };

  public shared func updateKK(updatedKK : KK.KKData) : async () {
    if (not kks.containsKey(updatedKK.id)) { Runtime.trap("Data tidak ditemukan") };
    kks.add(updatedKK.id, updatedKK);
  };

  public shared func deleteKK(id : Text) : async () {
    if (not kks.containsKey(id)) { Runtime.trap("Data tidak ditemukan") };
    kks.remove(id);
  };

  // Pengumuman CRUD - Public read access
  public shared func addPengumuman(pengumumanData : Pengumuman.PengumumanData) : async Text {
    let id = generateId("pengumuman_");
    let newPengumuman = { pengumumanData with id; createdAt = getCurrentTime() };
    pengumuman.add(id, newPengumuman);
    id;
  };

  public query func getPengumuman(id : Text) : async ?Pengumuman.PengumumanData {
    pengumuman.get(id);
  };

  public query func listPengumuman() : async [Pengumuman.PengumumanData] {
    pengumuman.values().toArray();
  };

  public query func listActivePengumuman() : async [Pengumuman.PengumumanData] {
    let filtered = pengumuman.values().filter(
      func(p) { p.status == #active }
    );
    filtered.toArray();
  };

  public shared func updatePengumuman(updatedPengumuman : Pengumuman.PengumumanData) : async () {
    if (not pengumuman.containsKey(updatedPengumuman.id)) { Runtime.trap("Data tidak ditemukan") };
    pengumuman.add(updatedPengumuman.id, updatedPengumuman);
  };

  public shared func deletePengumuman(id : Text) : async () {
    if (not pengumuman.containsKey(id)) { Runtime.trap("Data tidak ditemukan") };
    pengumuman.remove(id);
  };

  // Iuran CRUD
  public shared func addIuran(iuranData : Iuran.IuranData) : async Text {
    let id = generateId("iuran_");
    let newIuran = { iuranData with id; createdAt = getCurrentTime() };
    iuran.add(id, newIuran);
    id;
  };

  public query func getIuran(id : Text) : async ?Iuran.IuranData {
    iuran.get(id);
  };

  public query func listIuran() : async [Iuran.IuranData] {
    iuran.values().toArray();
  };

  public query func filterIuranByWarga(wargaId : Text) : async [Iuran.IuranData] {
    let filtered = iuran.values().filter(
      func(i) { i.wargaId == wargaId }
    );
    filtered.toArray();
  };

  public query func filterIuranByMonthYear(month : Nat, year : Nat) : async [Iuran.IuranData] {
    let filtered = iuran.values().filter(
      func(i) { i.month == month and i.year == year }
    );
    filtered.toArray();
  };

  public query func filterIuranByStatus(status : Iuran.Status) : async [Iuran.IuranData] {
    let filtered = iuran.values().filter(
      func(i) { i.status == status }
    );
    filtered.toArray();
  };

  public shared func updateIuran(updatedIuran : Iuran.IuranData) : async () {
    if (not iuran.containsKey(updatedIuran.id)) { Runtime.trap("Data tidak ditemukan") };
    iuran.add(updatedIuran.id, updatedIuran);
  };

  public shared func deleteIuran(id : Text) : async () {
    if (not iuran.containsKey(id)) { Runtime.trap("Data tidak ditemukan") };
    iuran.remove(id);
  };

  // Surat CRUD
  public shared func addSurat(suratData : Surat.SuratData) : async Text {
    let id = generateId("surat_");
    let newSurat = { suratData with id; createdAt = getCurrentTime() };
    surat.add(id, newSurat);
    id;
  };

  public query func getSurat(id : Text) : async ?Surat.SuratData {
    surat.get(id);
  };

  public query func listSurat() : async [Surat.SuratData] {
    surat.values().toArray();
  };

  public query func filterSuratByWarga(wargaId : Text) : async [Surat.SuratData] {
    let filtered = surat.values().filter(
      func(s) { s.wargaId == wargaId }
    );
    filtered.toArray();
  };

  public query func filterSuratByStatus(status : Surat.Status) : async [Surat.SuratData] {
    let filtered = surat.values().filter(
      func(s) { s.status == status }
    );
    filtered.toArray();
  };

  public shared func updateSurat(updatedSurat : Surat.SuratData) : async () {
    if (not surat.containsKey(updatedSurat.id)) { Runtime.trap("Data tidak ditemukan") };
    surat.add(updatedSurat.id, updatedSurat);
  };

  public shared func deleteSurat(id : Text) : async () {
    if (not surat.containsKey(id)) { Runtime.trap("Data tidak ditemukan") };
    surat.remove(id);
  };

  // Fasilitas CRUD
  public shared func addFasilitas(fasilitasData : Fasilitas.FasilitasData) : async Text {
    let id = generateId("fasilitas_");
    let newFasilitas = { fasilitasData with id; createdAt = getCurrentTime() };
    fasilitas.add(id, newFasilitas);
    id;
  };

  public query func getFasilitas(id : Text) : async ?Fasilitas.FasilitasData {
    fasilitas.get(id);
  };

  public query func listFasilitas() : async [Fasilitas.FasilitasData] {
    fasilitas.values().toArray();
  };

  public shared func updateFasilitas(updatedFasilitas : Fasilitas.FasilitasData) : async () {
    if (not fasilitas.containsKey(updatedFasilitas.id)) { Runtime.trap("Data tidak ditemukan") };
    fasilitas.add(updatedFasilitas.id, updatedFasilitas);
  };

  public shared func deleteFasilitas(id : Text) : async () {
    if (not fasilitas.containsKey(id)) { Runtime.trap("Data tidak ditemukan") };
    fasilitas.remove(id);
  };

  // Pengurus CRUD
  public shared func addPengurus(pengurusData : Pengurus.PengurusData) : async Text {
    let id = generateId("pengurus_");
    let newPengurus = { pengurusData with id; createdAt = getCurrentTime() };
    pengurus.add(id, newPengurus);
    id;
  };

  public query func getPengurus(id : Text) : async ?Pengurus.PengurusData {
    pengurus.get(id);
  };

  public query func listPengurus() : async [Pengurus.PengurusData] {
    pengurus.values().toArray();
  };

  public shared func updatePengurus(updatedPengurus : Pengurus.PengurusData) : async () {
    if (not pengurus.containsKey(updatedPengurus.id)) { Runtime.trap("Data tidak ditemukan") };
    pengurus.add(updatedPengurus.id, updatedPengurus);
  };

  public shared func deletePengurus(id : Text) : async () {
    if (not pengurus.containsKey(id)) { Runtime.trap("Data tidak ditemukan") };
    pengurus.remove(id);
  };

  // Website Settings CRUD - Public read and write
  public shared func setWebsiteSettings(settings : Website.WebsiteSettings) : async () {
    websiteSettings.add("settings", settings);
  };

  public query func getWebsiteSettings() : async ?Website.WebsiteSettings {
    websiteSettings.get("settings");
  };

  // Statistics - Public for landing page
  public query func getStatistics() : async Statistics {
    let totalWarga = warga.size();
    let totalKK = kks.size();

    let activePengumuman = pengumuman.values().filter(
      func(p) { p.status == #active }
    );
    let totalActivePengumuman = activePengumuman.size();

    let waitingSurat = surat.values().filter(
      func(s) { s.status == #waiting }
    );
    let totalWaitingSurat = waitingSurat.size();

    let paidIuran = iuran.values().filter(
      func(i) { i.status == #paid }
    );
    let totalPaidIuranThisMonth = paidIuran.size();

    {
      totalWarga;
      totalKK;
      totalActivePengumuman;
      totalWaitingSurat;
      totalPaidIuranThisMonth;
    };
  };
};
