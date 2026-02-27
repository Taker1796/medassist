using Microsoft.EntityFrameworkCore;
using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Data;

public class PromptDbContext : DbContext
{
    public PromptDbContext(DbContextOptions<PromptDbContext> options) : base(options)
    {
    }

    public DbSet<PromptTemplate> PromptTemplates => Set<PromptTemplate>();
    public DbSet<Specialty> Specialties => Set<Specialty>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Specialty>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(64);
            entity.Property(e => e.Name).HasMaxLength(256);
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<PromptTemplate>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TemplateText).IsRequired();
            entity.Property(e => e.CreatedAtUtc).HasDefaultValueSql("NOW()");
            entity.HasIndex(e => e.SpecialtyId);
            entity.HasIndex(e => e.IsDefault);
            entity.HasOne(e => e.Specialty)
                .WithMany(s => s.PromptTemplates)
                .HasForeignKey(e => e.SpecialtyId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
