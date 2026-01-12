'use client';

import { forwardRef } from 'react';
import { CV } from '@/types';
import { formatDate } from '@/lib/utils';

interface CVPreviewPdfProps {
  cv: CV;
}

/**
 * Harvard-style CV Template for PDF Export
 * Clean, professional, and elegant design
 * Uses inline styles with hex colors for html2canvas compatibility
 */
const CVPreviewPdf = forwardRef<HTMLDivElement, CVPreviewPdfProps>(({ cv }, ref) => {
  // Harvard-inspired color palette
  const colors = {
    primary: '#1a1a1a',      // Almost black for text
    secondary: '#4a4a4a',    // Dark gray for secondary text
    accent: '#8b0000',       // Harvard crimson for accents
    muted: '#666666',        // Muted gray
    light: '#999999',        // Light gray
    border: '#cccccc',       // Border color
    background: '#ffffff',   // White background
  };

  // Common styles
  const fontFamily = 'Georgia, "Times New Roman", Times, serif';
  const sansFont = '"Helvetica Neue", Helvetica, Arial, sans-serif';

  return (
    <div
      ref={ref}
      style={{
        backgroundColor: colors.background,
        padding: '48px 56px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: fontFamily,
        color: colors.primary,
        lineHeight: 1.5,
        fontSize: '11pt',
      }}
    >
      {/* ========== HEADER ========== */}
      <header style={{ textAlign: 'center', marginBottom: '24px' }}>
        {/* Name */}
        <h1
          style={{
            fontSize: '28pt',
            fontWeight: 'normal',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            margin: '0 0 12px 0',
            color: colors.primary,
            fontFamily: sansFont,
          }}
        >
          {cv.personalInfo.fullName}
        </h1>

        {/* Contact Info - Single Line */}
        <div
          style={{
            fontSize: '10pt',
            color: colors.secondary,
            fontFamily: sansFont,
          }}
        >
          {[
            cv.personalInfo.email,
            cv.personalInfo.phone,
            cv.personalInfo.location,
            cv.personalInfo.linkedin,
            cv.personalInfo.portfolio,
          ]
            .filter(Boolean)
            .join('  •  ')}
        </div>
      </header>

      {/* Divider */}
      <div
        style={{
          borderBottom: `2px solid ${colors.primary}`,
          marginBottom: '20px',
        }}
      />

      {/* ========== SUMMARY ========== */}
      {cv.personalInfo.summary && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={sectionTitleStyle(colors, sansFont)}>SUMMARY</h2>
          <p
            style={{
              margin: '0',
              textAlign: 'justify',
              color: colors.secondary,
              fontSize: '10.5pt',
            }}
          >
            {cv.personalInfo.summary}
          </p>
        </section>
      )}

      {/* ========== EXPERIENCE ========== */}
      {cv.experience && cv.experience.length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={sectionTitleStyle(colors, sansFont)}>EXPERIENCE</h2>
          
          {cv.experience.map((exp, index) => (
            <div
              key={exp.id}
              style={{
                marginBottom: index < cv.experience.length - 1 ? '16px' : '0',
              }}
            >
              {/* Job Title & Company */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '4px',
                }}
              >
                <div>
                  <span
                    style={{
                      fontWeight: 'bold',
                      fontSize: '11pt',
                    }}
                  >
                    {exp.position}
                  </span>
                  <span style={{ color: colors.muted }}> — </span>
                  <span style={{ fontStyle: 'italic' }}>{exp.company}</span>
                  {exp.location && (
                    <span style={{ color: colors.muted }}>, {exp.location}</span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '10pt',
                    color: colors.muted,
                    fontFamily: sansFont,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate!)}
                </span>
              </div>

              {/* Description */}
              {exp.description && (
                <p
                  style={{
                    margin: '4px 0',
                    color: colors.secondary,
                    fontSize: '10.5pt',
                  }}
                >
                  {exp.description}
                </p>
              )}

              {/* Achievements */}
              {exp.achievements && exp.achievements.length > 0 && (
                <ul
                  style={{
                    margin: '6px 0 0 0',
                    paddingLeft: '18px',
                    color: colors.secondary,
                    fontSize: '10.5pt',
                  }}
                >
                  {exp.achievements.map((achievement, i) => (
                    <li key={i} style={{ marginBottom: '3px' }}>
                      {achievement}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ========== EDUCATION ========== */}
      {cv.education && cv.education.length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={sectionTitleStyle(colors, sansFont)}>EDUCATION</h2>
          
          {cv.education.map((edu, index) => (
            <div
              key={edu.id}
              style={{
                marginBottom: index < cv.education.length - 1 ? '12px' : '0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '11pt' }}>
                    {edu.institution}
                  </span>
                  {edu.location && (
                    <span style={{ color: colors.muted }}>, {edu.location}</span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '10pt',
                    color: colors.muted,
                    fontFamily: sansFont,
                  }}
                >
                  {formatDate(edu.endDate!)}
                </span>
              </div>
              <div style={{ color: colors.secondary, fontSize: '10.5pt' }}>
                <span style={{ fontStyle: 'italic' }}>
                  {edu.degree}
                  {edu.field && ` in ${edu.field}`}
                </span>
                {edu.gpa && (
                  <span style={{ marginLeft: '12px' }}>GPA: {edu.gpa}</span>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ========== PROJECTS ========== */}
      {cv.projects && cv.projects.length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={sectionTitleStyle(colors, sansFont)}>PROJECTS</h2>
          
          {cv.projects.map((project, index) => (
            <div
              key={project.id}
              style={{
                marginBottom: index < cv.projects!.length - 1 ? '14px' : '0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '2px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '11pt' }}>
                    {project.name}
                  </span>
                  {project.role && (
                    <>
                      <span style={{ color: colors.muted }}> — </span>
                      <span style={{ fontStyle: 'italic' }}>{project.role}</span>
                    </>
                  )}
                </div>
                {project.duration && (
                  <span
                    style={{
                      fontSize: '10pt',
                      color: colors.muted,
                      fontFamily: sansFont,
                    }}
                  >
                    {project.duration}
                  </span>
                )}
              </div>

              {/* Technologies */}
              {project.technologies && project.technologies.length > 0 && (
                <div
                  style={{
                    fontSize: '10pt',
                    color: colors.muted,
                    marginBottom: '4px',
                    fontFamily: sansFont,
                  }}
                >
                  <span style={{ fontWeight: '500' }}>Technologies:</span>{' '}
                  {project.technologies.join(', ')}
                </div>
              )}

              {/* Description */}
              {project.description && (
                <p
                  style={{
                    margin: '4px 0',
                    color: colors.secondary,
                    fontSize: '10.5pt',
                  }}
                >
                  {project.description}
                </p>
              )}

              {/* Achievements */}
              {project.achievements && project.achievements.length > 0 && (
                <ul
                  style={{
                    margin: '6px 0 0 0',
                    paddingLeft: '18px',
                    color: colors.secondary,
                    fontSize: '10.5pt',
                  }}
                >
                  {project.achievements.map((achievement, i) => (
                    <li key={i} style={{ marginBottom: '3px' }}>
                      {achievement}
                    </li>
                  ))}
                </ul>
              )}

              {/* URL */}
              {project.url && (
                <div
                  style={{
                    fontSize: '9.5pt',
                    color: colors.accent,
                    marginTop: '4px',
                  }}
                >
                  {project.url}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ========== SKILLS ========== */}
      {cv.skills && cv.skills.length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={sectionTitleStyle(colors, sansFont)}>SKILLS</h2>
          <p
            style={{
              margin: '0',
              color: colors.secondary,
              fontSize: '10.5pt',
            }}
          >
            {cv.skills.join('  •  ')}
          </p>
        </section>
      )}

      {/* ========== CERTIFICATIONS ========== */}
      {cv.certifications && cv.certifications.length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <h2 style={sectionTitleStyle(colors, sansFont)}>CERTIFICATIONS</h2>
          
          {cv.certifications.map((cert) => (
            <div key={cert.id} style={{ marginBottom: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span style={{ fontWeight: 'bold', fontSize: '10.5pt' }}>
                  {cert.name}
                </span>
                <span
                  style={{
                    fontSize: '10pt',
                    color: colors.muted,
                    fontFamily: sansFont,
                  }}
                >
                  {formatDate(cert.date)}
                </span>
              </div>
              <div style={{ fontSize: '10pt', color: colors.muted }}>
                {cert.issuer}
                {cert.credentialId && ` • Credential ID: ${cert.credentialId}`}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ========== LANGUAGES ========== */}
      {cv.languages && cv.languages.length > 0 && (
        <section style={{ marginBottom: '0' }}>
          <h2 style={sectionTitleStyle(colors, sansFont)}>LANGUAGES</h2>
          <p
            style={{
              margin: '0',
              color: colors.secondary,
              fontSize: '10.5pt',
            }}
          >
            {cv.languages
              .map((lang) => `${lang.name} (${capitalizeFirst(lang.proficiency)})`)
              .join('  •  ')}
          </p>
        </section>
      )}
    </div>
  );
});

// Helper function for section titles
function sectionTitleStyle(
  colors: { accent: string; border: string },
  sansFont: string
): React.CSSProperties {
  return {
    fontSize: '11pt',
    fontWeight: 'bold',
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    margin: '0 0 10px 0',
    paddingBottom: '6px',
    borderBottom: `1px solid ${colors.border}`,
    color: colors.accent,
    fontFamily: sansFont,
  };
}

// Helper function to capitalize first letter
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

CVPreviewPdf.displayName = 'CVPreviewPdf';

export default CVPreviewPdf;
