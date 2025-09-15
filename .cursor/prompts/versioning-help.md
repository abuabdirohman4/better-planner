# 🤖 AI Versioning Helper Prompts

## 🚀 Quick Release Prompts

### Bug Fix Release
```
Saya mau bug fix release. Tolong bantu saya:
1. Update CHANGELOG.md dengan bug fixes
2. Jalankan patch release
3. Push ke GitHub dengan tag

Bug fixes:
- [Deskripsikan bug yang sudah diperbaiki]
```

### Feature Release  
```
Saya mau feature release. Tolong bantu saya:
1. Update CHANGELOG.md dengan fitur baru
2. Jalankan minor release
3. Push ke GitHub dengan tag

Fitur baru:
- [Deskripsikan fitur yang sudah ditambahkan]
```

### Major Release
```
Saya mau major release. Tolong bantu saya:
1. Update CHANGELOG.md dengan perubahan besar
2. Jalankan major release
3. Push ke GitHub dengan tag

Perubahan besar:
- [Deskripsikan perubahan besar yang sudah dilakukan]
```

## 📝 Changelog Update Prompts

### Update Changelog
```
Tolong update CHANGELOG.md untuk release ini:

Perubahan:
- [List semua perubahan]
- [Kategorikan: Added, Changed, Fixed, Removed, Security]
- [Gunakan format user-friendly]
```

### Review Changelog
```
Tolong review CHANGELOG.md:
1. Check format dan struktur
2. Verify semua perubahan sudah tercantum
3. Pastikan kategori sudah benar
4. Berikan rekomendasi perbaikan
```

## 🔄 Version Management Prompts

### Check Version Status
```
Tolong check status versioning:
1. Current version di package.json
2. Git tags yang tersedia
3. Status CHANGELOG.md
4. Git repository status
5. Berikan summary
```

### Version Bump
```
Tolong jalankan version bump untuk [patch|minor|major|prerelease]:
- Jenis: [pilih salah satu]
- Alasan: [jelaskan mengapa perlu release ini]
- Deskripsi: [deskripsi singkat perubahan]
```

## 🚨 Emergency Prompts

### Hotfix Release
```
URGENT: Hotfix release untuk bug kritis:

Bug: [deskripsikan bug kritis]
Dampak: [jelaskan dampak ke user]
Prioritas: [tinggi/sangat tinggi]

Tolong bantu complete hotfix process
```

### Rollback Release
```
Saya perlu rollback ke versi sebelumnya:

Versi target: [contoh: v1.0.1]
Alasan: [jelaskan mengapa perlu rollback]
Dampak: [jelaskan dampak rollback]

Tolong bantu rollback process
```

## 🔧 Custom Prompts

### Specific Feature Release
```
Release fitur [nama fitur]:

Fitur: [nama fitur]
Deskripsi: [deskripsi detail]
Jenis: [patch|minor|major]
Dampak: [dampak ke user]

Tolong bantu complete release process
```

### Technical Release
```
Release perubahan teknis:

Perubahan:
- [List perubahan teknis]
- [Contoh: Updated dependencies]
- [Contoh: Performance improvements]

Jenis: [patch|minor|major]
Tolong bantu dengan complete process
```

## 📋 Verification Prompts

### Verify Release
```
Tolong verify release yang sudah dibuat:
1. Check version consistency
2. Verify git tags
3. Check CHANGELOG.md
4. Verify GitHub push
5. Berikan status report
```

### Check Release Readiness
```
Tolong check apakah siap untuk release:
1. Review semua perubahan
2. Check testing status
3. Verify documentation
4. Check deployment readiness
5. Berikan rekomendasi
```

## 🎯 Usage Tips

### ✅ Do's
- **Be specific** tentang perubahan yang sudah dilakukan
- **Include examples** untuk bug fixes atau fitur
- **Mention impact** ke user experience
- **Check git status** sebelum meminta bantuan
- **Review hasil** sebelum melanjutkan

### ❌ Don'ts
- Jangan lupa commit perubahan terlebih dahulu
- Jangan skip update CHANGELOG.md
- Jangan lupa push tags ke GitHub
- Jangan release tanpa testing
- Jangan lupa verifikasi hasil

## 🚀 Quick Commands

```bash
# Check status
git status
npm version

# Quick release
./scripts/quick-release.sh patch "Fixed calendar display issue"
./scripts/quick-release.sh minor "Added habit streak tracking"
./scripts/quick-release.sh major "Complete UI redesign"

# Manual release
./scripts/version.sh patch
./scripts/version.sh minor
./scripts/version.sh major
```

---

**📚 Related Files**: `CHANGELOG.md`, `VERSION.md`, `scripts/version.sh`
**🔧 Scripts**: `./scripts/quick-release.sh [type] [description]`
**📋 Templates**: `.cursor/templates/versioning-prompts.md`

