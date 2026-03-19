using Microsoft.EntityFrameworkCore;
using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Data;

public class PromptDbContext : DbContext
{
    public PromptDbContext(DbContextOptions<PromptDbContext> options) : base(options)
    {
    }

    public DbSet<PromptTemplate> PromptTemplates => Set<PromptTemplate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PromptTemplate>(entity =>
        {
            entity.HasKey(e => e.Code);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(64);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Text).IsRequired().HasColumnName("Text").HasColumnType("text");
        });
    }
}
