import React, { useState, useEffect, useRef } from "react";
import type { AdvisorMetadata, StudentPreferencePayload } from "../types";
import {
  Sparkles,
  MapPin,
  GraduationCap,
  Languages,
  DollarSign,
  Compass,
  AlertCircle,
  X,
  Plus,
} from "lucide-react";

interface Props {
  metadata: AdvisorMetadata;
  initialValues?: StudentPreferencePayload | null;
  onSubmit: (payload: StudentPreferencePayload) => void;
  loading: boolean;
}

export const StudentPreferenceForm: React.FC<Props> = ({
  metadata,
  initialValues,
  onSubmit,
  loading,
}) => {
  // Required
  const [scoreType, setScoreType] = useState<string>(initialValues?.score_type || "SAY");
  const [rankInput, setRankInput] = useState<string>(
    initialValues?.rank ? String(initialValues.rank) : ""
  );
  const [targetPrograms, setTargetPrograms] = useState<string[]>(
    initialValues?.target_programs || []
  );

  // Optional with Strictness (Şart vs Tercih)
  const [preferredCities, setPreferredCities] = useState<string[]>(
    initialValues?.preferred_cities || []
  );
  const [citiesStrict, setCitiesStrict] = useState<boolean>(
    initialValues?.cities_strict || false
  );

  const [universityType, setUniversityType] = useState<string>(
    initialValues?.university_type || "all"
  );
  const [universityTypeStrict, setUniversityTypeStrict] = useState<boolean>(
    initialValues?.university_type_strict || false
  );

  const [teachingLanguage, setTeachingLanguage] = useState<string>(
    initialValues?.teaching_language || "all"
  );
  const [languageStrict, setLanguageStrict] = useState<boolean>(
    initialValues?.language_strict || false
  );

  const [scholarship, setScholarship] = useState<string>(
    initialValues?.scholarship || "all"
  );
  const [scholarshipStrict, setScholarshipStrict] = useState<boolean>(
    initialValues?.scholarship_strict || false
  );

  const [maxTuition, setMaxTuition] = useState<string>(
    initialValues?.max_tuition ? String(initialValues.max_tuition) : ""
  );
  const [tuitionStrict, setTuitionStrict] = useState<boolean>(
    initialValues?.tuition_strict || false
  );

  const [priority, setPriority] = useState<string>(
    initialValues?.priority || "rank"
  );

  // UI Autocomplete state for programs and cities
  const [progSearch, setProgSearch] = useState<string>("");
  const [progDropdownOpen, setProgDropdownOpen] = useState<boolean>(false);
  const progRef = useRef<HTMLDivElement>(null);

  const [citySearch, setCitySearch] = useState<string>("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState<boolean>(false);
  const cityRef = useRef<HTMLDivElement>(null);

  const [formError, setFormError] = useState<string | null>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (progRef.current && !progRef.current.contains(e.target as Node)) {
        setProgDropdownOpen(false);
      }
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter autocomplete programs
  const filteredPrograms = metadata.popular_programs
    .filter(
      (p) =>
        p.toLowerCase().includes(progSearch.toLowerCase()) &&
        !targetPrograms.includes(p)
    )
    .slice(0, 10);

  // Filter autocomplete cities
  const filteredCities = metadata.cities
    .filter(
      (c) =>
        c.toLowerCase().includes(citySearch.toLowerCase()) &&
        !preferredCities.includes(c)
    )
    .slice(0, 10);

  // Parse formatted rank
  const cleanRank = rankInput.replace(/\./g, "").replace(/,/g, "").trim();
  const parsedRankNum = parseInt(cleanRank, 10);
  const isValidRank = !isNaN(parsedRankNum) && parsedRankNum > 0;

  const handleRankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow digits and dots
    const digitsOnly = raw.replace(/\D/g, "");
    if (!digitsOnly) {
      setRankInput("");
      return;
    }
    // Format with dots
    const num = parseInt(digitsOnly, 10);
    setRankInput(num.toLocaleString("tr-TR"));
  };

  const handleAddProgram = (progName: string) => {
    if (!targetPrograms.includes(progName)) {
      setTargetPrograms([...targetPrograms, progName]);
    }
    setProgSearch("");
    setProgDropdownOpen(false);
  };

  const handleRemoveProgram = (progName: string) => {
    setTargetPrograms(targetPrograms.filter((p) => p !== progName));
  };

  const handleAddCity = (cityName: string) => {
    if (!preferredCities.includes(cityName)) {
      setPreferredCities([...preferredCities, cityName]);
    }
    setCitySearch("");
    setCityDropdownOpen(false);
  };

  const handleRemoveCity = (cityName: string) => {
    setPreferredCities(preferredCities.filter((c) => c !== cityName));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isValidRank) {
      setFormError("Lütfen geçerli bir YKS başarı sırası girin (Örn: 120.000).");
      return;
    }

    if (targetPrograms.length === 0) {
      setFormError("Lütfen en az bir bölüm tercihi ekleyin (Örn: Bilgisayar Mühendisliği).");
      return;
    }

    const payload: StudentPreferencePayload = {
      score_type: scoreType,
      rank: parsedRankNum,
      target_programs: targetPrograms,
      preferred_cities: preferredCities,
      cities_strict: citiesStrict,
      university_type: universityType,
      university_type_strict: universityTypeStrict,
      teaching_language: teachingLanguage,
      language_strict: languageStrict,
      scholarship: scholarship,
      scholarship_strict: scholarshipStrict,
      max_tuition: maxTuition ? parseFloat(maxTuition.replace(/\./g, "").replace(",", ".")) : null,
      tuition_strict: tuitionStrict,
      priority: priority,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-4 h-4 text-indigo-400" />
            Akıllı Tercih Danışmanı
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            2026 YKS Üniversite Tercih Asistanı
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Puan türünü, başarı sıranı ve ilgilendiğin bölümleri gir; kriterlerini <strong>Şart</strong> veya <strong>Tercih</strong> olarak belirle. Yapay zeka ve geçmiş kabul verileriyle kişiselleştirilmiş öneri listeni oluştur.
          </p>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Section 1: Required Fields */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          Temel YKS Bilgileri <span className="text-xs text-rose-400 font-normal">(Zorunlu)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Puan Türü */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              1. Puan Türü
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {metadata.score_types.map((st) => (
                <button
                  type="button"
                  key={st.id}
                  onClick={() => setScoreType(st.id)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition border ${
                    scoreType === st.id
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                      : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  {st.id}
                </button>
              ))}
            </div>
          </div>

          {/* Başarı Sırası */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              2. YKS Başarı Sıran
            </label>
            <div className="relative">
              <input
                type="text"
                value={rankInput}
                onChange={handleRankChange}
                placeholder="Örn: 120.000"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
              />
              {isValidRank && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {parsedRankNum.toLocaleString("tr-TR")}. sıra
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Gerçek YKS sınav veya deneme sıralamanızı girin.
            </p>
          </div>
        </div>

        {/* Bölüm Tercihleri (Tag Autocomplete) */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80" ref={progRef}>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
            3. İlgilendiğin Bölümler
          </label>

          {/* Selected Tags */}
          <div className="flex flex-wrap gap-2 mb-2">
            {targetPrograms.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium"
              >
                {p}
                <button
                  type="button"
                  onClick={() => handleRemoveProgram(p)}
                  className="hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Input & Autocomplete */}
          <div className="relative">
            <input
              type="text"
              value={progSearch}
              onChange={(e) => {
                setProgSearch(e.target.value);
                setProgDropdownOpen(true);
              }}
              onFocus={() => setProgDropdownOpen(true)}
              placeholder="Bölüm ara ve ekle (Örn: Bilgisayar Mühendisliği, Mimarlık, Tıp, Yazılım...)"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
            />

            {progDropdownOpen && filteredPrograms.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-800/60">
                {filteredPrograms.map((prog) => (
                  <button
                    type="button"
                    key={prog}
                    onClick={() => handleAddProgram(prog)}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between group transition"
                  >
                    <span>{prog}</span>
                    <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Birden fazla bölüm seçebilirsiniz. Örnek: Bilgisayar Mühendisliği, Yapay Zeka, Yazılım Mühendisliği.
          </p>
        </div>
      </div>

      {/* Section 2: Optional Criteria with Strictness Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Özelleştirilmiş Tercih Kriterleri <span className="text-xs text-slate-400 font-normal">(İsteğe Bağlı)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Her kriteri <strong>Şart</strong> (sağlamayan elenir) veya <strong>Tercih</strong> (sıralamayı yukarı taşır) olarak seçebilirsiniz.
          </p>
        </div>

        {/* 1. Şehir Tercihi */}
        <div className="space-y-2 pb-4 border-b border-slate-800/60" ref={cityRef}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-400" />
              Şehir Tercihi
            </label>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setCitiesStrict(false)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                  !citiesStrict ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Tercih
              </button>
              <button
                type="button"
                onClick={() => setCitiesStrict(true)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                  citiesStrict ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Şart
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {preferredCities.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
              >
                {c}
                <button
                  type="button"
                  onClick={() => handleRemoveCity(c)}
                  className="hover:text-rose-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              value={citySearch}
              onChange={(e) => {
                setCitySearch(e.target.value);
                setCityDropdownOpen(true);
              }}
              onFocus={() => setCityDropdownOpen(true)}
              placeholder="Şehir ara ve ekle (Örn: İstanbul, Ankara, İzmir, Kayseri...)"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />

            {cityDropdownOpen && filteredCities.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-800/60">
                {filteredCities.map((city) => (
                  <button
                    type="button"
                    key={city}
                    onClick={() => handleAddCity(city)}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between group transition"
                  >
                    <span>{city}</span>
                    <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. Üniversite Türü & Öğretim Dili Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-4 border-b border-slate-800/60">
          {/* Üniversite Türü */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                Üniversite Türü
              </label>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setUniversityTypeStrict(false)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    !universityTypeStrict ? "bg-indigo-600 text-white" : "text-slate-400"
                  }`}
                >
                  Tercih
                </button>
                <button
                  type="button"
                  onClick={() => setUniversityTypeStrict(true)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    universityTypeStrict ? "bg-rose-600 text-white" : "text-slate-400"
                  }`}
                >
                  Şart
                </button>
              </div>
            </div>

            <select
              value={universityType}
              onChange={(e) => setUniversityType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              {metadata.university_types.map((ut) => (
                <option key={ut.id} value={ut.id}>
                  {ut.label}
                </option>
              ))}
            </select>
          </div>

          {/* Öğretim Dili */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-indigo-400" />
                Öğretim Dili
              </label>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setLanguageStrict(false)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    !languageStrict ? "bg-indigo-600 text-white" : "text-slate-400"
                  }`}
                >
                  Tercih
                </button>
                <button
                  type="button"
                  onClick={() => setLanguageStrict(true)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    languageStrict ? "bg-rose-600 text-white" : "text-slate-400"
                  }`}
                >
                  Şart
                </button>
              </div>
            </div>

            <select
              value={teachingLanguage}
              onChange={(e) => setTeachingLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              {metadata.teaching_languages.map((tl) => (
                <option key={tl.id} value={tl.id}>
                  {tl.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Burs ve Maksimum Ücret */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-4 border-b border-slate-800/60">
          {/* Burs Durumu */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-indigo-400" />
                Burs / İndirim Durumu
              </label>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setScholarshipStrict(false)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    !scholarshipStrict ? "bg-indigo-600 text-white" : "text-slate-400"
                  }`}
                >
                  Tercih
                </button>
                <button
                  type="button"
                  onClick={() => setScholarshipStrict(true)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    scholarshipStrict ? "bg-rose-600 text-white" : "text-slate-400"
                  }`}
                >
                  Şart
                </button>
              </div>
            </div>

            <select
              value={scholarship}
              onChange={(e) => setScholarship(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              {metadata.scholarships.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Maksimum Yıllık Ücret */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-indigo-400" />
                Maksimum Yıllık Ücret (TL)
              </label>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTuitionStrict(false)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    !tuitionStrict ? "bg-indigo-600 text-white" : "text-slate-400"
                  }`}
                >
                  Tercih
                </button>
                <button
                  type="button"
                  onClick={() => setTuitionStrict(true)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    tuitionStrict ? "bg-rose-600 text-white" : "text-slate-400"
                  }`}
                >
                  Şart
                </button>
              </div>
            </div>

            <input
              type="number"
              value={maxTuition}
              onChange={(e) => setMaxTuition(e.target.value)}
              placeholder="Örn: 250000"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[10px] text-slate-400">
              * Not: Yıllık ücret bilgileri resmi kılavuzda doğrulanmadığı takdirde &apos;Şart&apos; seçilirse programlar elenebilir.
            </p>
          </div>
        </div>

        {/* 4. Benim İçin En Önemli Kriter */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Benim İçin En Önemli Kriter (Öneri Sıralamasını Şekillendirir)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {metadata.priorities.map((p) => {
              const isSelected = priority === p.id;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  className={`p-3 rounded-xl border text-left transition ${
                    isSelected
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold block">{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Tercih Önerileri Hazırlanıyor...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Kişiselleştirilmiş Tercih Listemi Oluştur</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
