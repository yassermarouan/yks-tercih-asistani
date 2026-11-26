import React, { useState, useEffect, useRef } from "react";
import type { AdvisorMetadata, StudentPreferencePayload } from "../types";
import {
  AlertCircle,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";

interface Props {
  metadata: AdvisorMetadata;
  initialValues?: StudentPreferencePayload | null;
  onSubmit: (payload: StudentPreferencePayload) => void;
  onReset?: () => void;
  loading: boolean;
}

export const StudentPreferenceForm: React.FC<Props> = ({
  metadata,
  initialValues,
  onSubmit,
  onReset,
  loading,
}) => {
  const [scoreType, setScoreType] = useState<string>(initialValues?.score_type || "SAY");
  const [rankInput, setRankInput] = useState<string>(
    initialValues?.rank ? Number(initialValues.rank).toLocaleString("tr-TR") : ""
  );
  const [targetPrograms, setTargetPrograms] = useState<string[]>(
    initialValues?.target_programs || []
  );

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

  const hasExtraFilters =
    universityType !== "all" ||
    teachingLanguage !== "all" ||
    scholarship !== "all" ||
    Boolean(maxTuition);

  const [showExtraFilters, setShowExtraFilters] = useState<boolean>(hasExtraFilters);

  const extraFilterCount = [
    universityType !== "all",
    teachingLanguage !== "all",
    scholarship !== "all",
    Boolean(maxTuition),
  ].filter(Boolean).length;

  const [progSearch, setProgSearch] = useState<string>("");
  const [progDropdownOpen, setProgDropdownOpen] = useState<boolean>(false);
  const progRef = useRef<HTMLDivElement>(null);

  const [citySearch, setCitySearch] = useState<string>("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState<boolean>(false);
  const cityRef = useRef<HTMLDivElement>(null);

  const [formError, setFormError] = useState<string | null>(null);

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

  const filteredPrograms = metadata.popular_programs
    .filter(
      (p) =>
        p.toLowerCase().includes(progSearch.toLowerCase()) &&
        !targetPrograms.includes(p)
    )
    .slice(0, 10);

  const filteredCities = metadata.cities
    .filter(
      (c) =>
        c.toLowerCase().includes(citySearch.toLowerCase()) &&
        !preferredCities.includes(c)
    )
    .slice(0, 10);

  const cleanRank = rankInput.replace(/\./g, "").replace(/,/g, "").trim();
  const parsedRankNum = parseInt(cleanRank, 10);
  const isValidRank = !isNaN(parsedRankNum) && parsedRankNum > 0;

  const handleRankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    if (!digitsOnly) {
      setRankInput("");
      return;
    }
    setRankInput(parseInt(digitsOnly, 10).toLocaleString("tr-TR"));
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

  const handleClearAll = () => {
    setScoreType("SAY");
    setRankInput("");
    setTargetPrograms([]);
    setPreferredCities([]);
    setCitiesStrict(false);
    setUniversityType("all");
    setUniversityTypeStrict(false);
    setTeachingLanguage("all");
    setLanguageStrict(false);
    setScholarship("all");
    setScholarshipStrict(false);
    setMaxTuition("");
    setTuitionStrict(false);
    setPriority("rank");
    setFormError(null);
    onReset?.();
  };

  const hasAnyInput =
    Boolean(rankInput) ||
    targetPrograms.length > 0 ||
    preferredCities.length > 0 ||
    hasExtraFilters;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isValidRank) {
      setFormError("Lütfen geçerli bir YKS başarı sırası girin (Örn: 45.000).");
      return;
    }

    if (targetPrograms.length === 0) {
      setFormError("Lütfen en az bir bölüm ekleyin (Örn: Bilgisayar Mühendisliği).");
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

  const renderStrictnessToggle = (
    isStrict: boolean,
    onChange: (strict: boolean) => void
  ) => (
    <div className="inline-flex items-center bg-[#DFE4D5] dark:bg-[#09090b] p-0.5 rounded-lg border border-[#D0D5C6] dark:border-zinc-800 text-[11px]">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
          !isStrict
            ? "bg-[#F0F1E9] dark:bg-zinc-800 text-[#171A12] dark:text-zinc-100 shadow-[0_2px_10px_rgba(23,26,18,0.04)]"
            : "text-[#6B7065] hover:text-[#171A12] dark:hover:text-zinc-300"
        }`}
      >
        Tercih
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
          isStrict
            ? "bg-rose-500/15 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300"
            : "text-[#6B7065] hover:text-[#171A12] dark:hover:text-zinc-300"
        }`}
      >
        Şart
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      {/* Clean Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#171A12] dark:text-zinc-100 tracking-tight">
            Kişisel Tercih Listenizi Oluşturun
          </h2>
          <p className="text-sm text-[#6B7065] dark:text-zinc-400">
            Sıralamanızı ve hedef bölümlerinizi girin; size en uygun üniversiteleri gerekçeleriyle sıralayalım.
          </p>
        </div>

        {hasAnyInput && (
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-100 bg-[#F0F1E9] dark:bg-zinc-900 border border-[#D0D5C6] dark:border-zinc-800 transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Temizle</span>
          </button>
        )}
      </div>

      {formError && (
        <div className="p-3.5 rounded-xl bg-rose-500/12 dark:bg-rose-500/10 border border-rose-600/25 dark:border-rose-500/25 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Section 1: Core Info */}
      <div className="bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-[0_2px_10px_rgba(23,26,18,0.04)] dark:shadow-none">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#171A12] dark:text-zinc-100">Temel Bilgiler</h3>
          <span className="text-xs text-[#6B7065]">Zorunlu</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Score Type */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#171A12] dark:text-zinc-300 block">
              Puan Türü
            </label>
            <div className="grid grid-cols-4 gap-2">
              {metadata.score_types.map((st) => (
                <button
                  type="button"
                  key={st.id}
                  onClick={() => setScoreType(st.id)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-medium transition border cursor-pointer ${
                    scoreType === st.id
                      ? "bg-[#C6F432] border-[#C6F432] text-[#171A12] font-semibold"
                      : "bg-[#E8EBE0] dark:bg-[#09090b] border-[#D0D5C6] dark:border-zinc-800 text-[#171A12] dark:text-zinc-300 hover:border-[#B6BEA9] dark:hover:border-zinc-700"
                  }`}
                >
                  {st.id}
                </button>
              ))}
            </div>
          </div>

          {/* Rank Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#171A12] dark:text-zinc-300 block">
              YKS Başarı Sırası
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={rankInput}
                onChange={handleRankChange}
                placeholder="Örn: 45.000"
                className="w-full px-3.5 pr-9 py-2.5 bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 rounded-xl text-[#171A12] dark:text-zinc-100 font-mono text-sm placeholder-[#6B7065]/75 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
              />
              {rankInput && (
                <button
                  type="button"
                  onClick={() => setRankInput("")}
                  title="Sıralamayı Temizle"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#6B7065] hover:text-[#171A12] dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Target Programs */}
        <div className="space-y-2 pt-3 border-t border-[#D0D5C6] dark:border-zinc-800/80" ref={progRef}>
          <label className="text-xs font-medium text-[#171A12] dark:text-zinc-300 block">
            İlgilendiğiniz Bölümler
          </label>

          {targetPrograms.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {targetPrograms.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E5EDC8] dark:bg-emerald-500/12 border border-[#C5D496] dark:border-emerald-500/25 text-[#526B19] dark:text-emerald-300 text-xs font-medium"
                >
                  {p}
                  <button
                    type="button"
                    onClick={() => handleRemoveProgram(p)}
                    className="hover:text-emerald-950 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={progSearch}
              onChange={(e) => {
                setProgSearch(e.target.value);
                setProgDropdownOpen(true);
              }}
              onFocus={() => setProgDropdownOpen(true)}
              placeholder="Bölüm ara ve ekle (Örn: Bilgisayar Mühendisliği, Hukuk, Tıp...)"
              className="w-full px-3.5 py-2.5 bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 rounded-xl text-[#171A12] dark:text-zinc-100 text-sm placeholder-[#6B7065]/75 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
            />

            {progDropdownOpen && filteredPrograms.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#F0F1E9] dark:bg-[#16161a] border border-[#D0D5C6] dark:border-zinc-800 rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto divide-y divide-[#D0D5C6] dark:divide-zinc-800/60">
                {filteredPrograms.map((prog) => (
                  <button
                    type="button"
                    key={prog}
                    onClick={() => handleAddProgram(prog)}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-[#171A12] dark:text-zinc-200 hover:bg-[#E5EDC8]/55 dark:hover:bg-zinc-800/70 flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{prog}</span>
                    <Plus className="w-3.5 h-3.5 text-[#6B7065]" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Optional Criteria */}
      <div className="bg-gradient-to-b from-[#F2F3EC] to-[#ECEEE3] dark:bg-none dark:bg-[#111114] border border-[#D0D5C6] dark:border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-[0_2px_10px_rgba(23,26,18,0.04)] dark:shadow-none">
        <div>
          <h3 className="text-sm font-semibold text-[#171A12] dark:text-zinc-100">Tercih Kriterleri</h3>
          <p className="text-xs text-[#6B7065] mt-0.5">
            İsteğe bağlı olarak şehir, öncelik ve ek filtreleri belirleyebilirsiniz.
          </p>
        </div>

        {/* City Selection */}
        <div className="space-y-2" ref={cityRef}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[#171A12] dark:text-zinc-300">Şehir Tercihi</label>
            {renderStrictnessToggle(citiesStrict, setCitiesStrict)}
          </div>

          {preferredCities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {preferredCities.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#DFE4D5] dark:bg-zinc-800/80 border border-[#D0D5C6] dark:border-zinc-700/80 text-[#171A12] dark:text-zinc-200 text-xs"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => handleRemoveCity(c)}
                    className="text-[#6B7065] hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={citySearch}
              onChange={(e) => {
                setCitySearch(e.target.value);
                setCityDropdownOpen(true);
              }}
              onFocus={() => setCityDropdownOpen(true)}
              placeholder="Şehir ekleyin (Örn: İstanbul, Ankara, İzmir...)"
              className="w-full px-3.5 py-2 bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 rounded-xl text-[#171A12] dark:text-zinc-100 text-xs placeholder-[#6B7065]/75 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
            />

            {cityDropdownOpen && filteredCities.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#F0F1E9] dark:bg-[#16161a] border border-[#D0D5C6] dark:border-zinc-800 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-[#D0D5C6] dark:divide-zinc-800/60">
                {filteredCities.map((city) => (
                  <button
                    type="button"
                    key={city}
                    onClick={() => handleAddCity(city)}
                    className="w-full text-left px-3.5 py-2 text-xs text-[#171A12] dark:text-zinc-200 hover:bg-[#E5EDC8]/55 dark:hover:bg-zinc-800/70 flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{city}</span>
                    <Plus className="w-3.5 h-3.5 text-[#6B7065]" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Priority */}
        <div className="space-y-2 pt-3 border-t border-[#D0D5C6] dark:border-zinc-800/80">
          <label className="text-xs font-medium text-[#171A12] dark:text-zinc-300 block">
            Öncelikli Tercih Ölçütü
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {metadata.priorities.map((p) => {
              const isSelected = priority === p.id;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  className={`px-3 py-2.5 rounded-xl border text-left text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? "bg-[#E5EDC8] dark:bg-emerald-500/12 border-[#B8CB82] dark:border-emerald-500/40 text-[#526B19] dark:text-emerald-300"
                      : "bg-[#E8EBE0] dark:bg-[#09090b] border-[#D0D5C6] dark:border-zinc-800 text-[#6B7065] dark:text-zinc-400 hover:text-[#171A12] dark:hover:text-zinc-200"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Extra Filters */}
        <div className="pt-3 border-t border-[#D0D5C6] dark:border-zinc-800/80">
          <button
            type="button"
            onClick={() => setShowExtraFilters((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-medium text-[#171A12] dark:text-zinc-300 hover:text-[#171A12] dark:hover:text-white py-1 transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#6B7065]" />
              <span>Üniversite Türü, Dil ve Burs Filtreleri</span>
              {extraFilterCount > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-[#E5EDC8] dark:bg-emerald-500/15 text-[#526B19] dark:text-emerald-400 text-[11px]">
                  {extraFilterCount} seçili
                </span>
              )}
            </span>
            {showExtraFilters ? (
              <ChevronUp className="w-4 h-4 text-[#6B7065]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#6B7065]" />
            )}
          </button>

          {showExtraFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#6B7065] dark:text-zinc-400">Üniversite Türü</label>
                  {renderStrictnessToggle(universityTypeStrict, setUniversityTypeStrict)}
                </div>
                <select
                  value={universityType}
                  onChange={(e) => setUniversityType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 rounded-xl text-[#171A12] dark:text-zinc-100 text-xs focus:outline-none focus:border-emerald-500"
                >
                  {metadata.university_types.map((ut) => (
                    <option key={ut.id} value={ut.id}>
                      {ut.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#6B7065] dark:text-zinc-400">Öğretim Dili</label>
                  {renderStrictnessToggle(languageStrict, setLanguageStrict)}
                </div>
                <select
                  value={teachingLanguage}
                  onChange={(e) => setTeachingLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 rounded-xl text-[#171A12] dark:text-zinc-100 text-xs focus:outline-none focus:border-emerald-500"
                >
                  {metadata.teaching_languages.map((tl) => (
                    <option key={tl.id} value={tl.id}>
                      {tl.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#6B7065] dark:text-zinc-400">Burs / İndirim</label>
                  {renderStrictnessToggle(scholarshipStrict, setScholarshipStrict)}
                </div>
                <select
                  value={scholarship}
                  onChange={(e) => setScholarship(e.target.value)}
                  className="w-full px-3 py-2 bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 rounded-xl text-[#171A12] dark:text-zinc-100 text-xs focus:outline-none focus:border-emerald-500"
                >
                  {metadata.scholarships.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#6B7065] dark:text-zinc-400">Maksimum Yıllık Ücret (TL)</label>
                  {renderStrictnessToggle(tuitionStrict, setTuitionStrict)}
                </div>
                <input
                  type="number"
                  value={maxTuition}
                  onChange={(e) => setMaxTuition(e.target.value)}
                  placeholder="Örn: 250000"
                  className="w-full px-3 py-2 bg-[#E8EBE0] dark:bg-[#09090b] border border-[#D0D5C6] dark:border-zinc-800 rounded-xl text-[#171A12] dark:text-zinc-100 text-xs placeholder-[#6B7065]/75 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Action */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#C6F432] hover:bg-[#b5e422] text-[#171A12] font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              <span>Öneriler Hazırlanıyor...</span>
            </>
          ) : (
            <>
              <span>Tercih Önerilerini Gör</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
