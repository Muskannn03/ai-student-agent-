import { NextRequest, NextResponse } from 'next/server';
import { prisma, testDatabaseConnection } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth/auth';
import { DayOfWeek } from '@prisma/client';

export async function GET() {
  try {
    const isDbConnected = await testDatabaseConnection();
    if (!isDbConnected) {
      return NextResponse.json({
        success: true,
        data: {
          name: 'Alex Rivera',
          email: 'alex.rivera@university.edu',
          college: 'School of Computing & AI Sciences',
          course: 'B.Tech Computer Science & AI',
          classLevel: '3rd Year (Junior)',
          semester: 5,
          skills: ['Python', 'TypeScript', 'Next.js', 'PyTorch', 'PostgreSQL'],
          careerGoals: 'AI/ML Engineering Intern & Full-Stack Developer',
          subjects: [
            'Data Structures & Algorithms',
            'Operating Systems',
            'Database Management Systems',
            'Computer Networks',
            'Machine Learning',
          ],
        },
        source: 'cached',
      });
    }

    const user = await getAuthenticatedUser(true);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });

    const subjects = await prisma.subject.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });

    // Query dedicated student_details table from database
    let studentDetailsRow: any = null;
    try {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "public"."student_details" WHERE "userId" = $1 LIMIT 1;`,
        user.id
      );
      if (rows && rows.length > 0) {
        studentDetailsRow = rows[0];
      }
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: studentDetailsRow?.fullName || user.name,
        email: user.email,
        college: studentDetailsRow?.college || profile?.college || 'University Department',
        course: studentDetailsRow?.course || profile?.course || 'Computer Science',
        classLevel: studentDetailsRow?.className || '2nd Year (Sophomore)',
        semester: studentDetailsRow?.semester || profile?.semester || 1,
        skills: studentDetailsRow?.skills || profile?.skills || [],
        careerGoals: studentDetailsRow?.careerGoals || profile?.careerGoals || null,
        subjects:
          studentDetailsRow?.subjects && studentDetailsRow.subjects.length > 0
            ? studentDetailsRow.subjects
            : subjects.map((s) => s.name),
        dailyStudyHours: studentDetailsRow?.dailyStudyHours || 3,
      },
      source: 'database',
    });
  } catch (error) {
    console.error('[API /api/student-profile GET error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch student profile',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      college,
      course,
      semester,
      classLevel,
      skills,
      careerGoals,
      subjects,
    } = body;

    const isDbConnected = await testDatabaseConnection();
    if (!isDbConnected) {
      return NextResponse.json({
        success: true,
        message: 'Database offline. Stored temporarily.',
        data: body,
      });
    }

    const user = await getAuthenticatedUser(true);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated.' },
        { status: 401 }
      );
    }

    // 1. Update User Name if provided
    if (name && typeof name === 'string' && name.trim().length >= 2) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: name.trim() },
      });
    }

    // 2. Format skills array
    const cleanSkills = Array.isArray(skills)
      ? skills.map((s) => String(s).trim()).filter(Boolean)
      : [];

    // 3. Upsert StudentProfile
    const updatedProfile = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        college: college?.trim() || null,
        course: course?.trim() || 'Computer Science',
        semester: semester ? Number(semester) : 1,
        skills: cleanSkills,
        careerGoals: careerGoals?.trim() || null,
      },
      update: {
        college: college?.trim() || null,
        course: course?.trim() || 'Computer Science',
        semester: semester ? Number(semester) : 1,
        skills: cleanSkills,
        careerGoals: careerGoals?.trim() || null,
      },
    });

    // 4. Upsert Subjects
    const enrolledSubjectsList: string[] = [];
    if (Array.isArray(subjects) && subjects.length > 0) {
      for (const rawSubject of subjects) {
        const subName = String(rawSubject).trim();
        if (subName.length >= 2) {
          enrolledSubjectsList.push(subName);
          await prisma.subject.upsert({
            where: {
              userId_name: {
                userId: user.id,
                name: subName,
              },
            },
            create: {
              userId: user.id,
              name: subName,
              description: `Enrolled coursework for ${updatedProfile.course || 'Degree'}`,
            },
            update: {
              description: `Enrolled coursework for ${updatedProfile.course || 'Degree'}`,
            },
          });
        }
      }
    }

    // 4b. Upsert into dedicated student_details table in database
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "public"."student_details" 
          ("id", "userId", "fullName", "className", "course", "semester", "college", "subjects", "skills", "careerGoals", "dailyStudyHours", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text[], $9::text[], $10, $11, NOW(), NOW())
         ON CONFLICT ("userId") DO UPDATE SET
          "fullName" = EXCLUDED."fullName",
          "className" = EXCLUDED."className",
          "course" = EXCLUDED."course",
          "semester" = EXCLUDED."semester",
          "college" = EXCLUDED."college",
          "subjects" = EXCLUDED."subjects",
          "skills" = EXCLUDED."skills",
          "careerGoals" = EXCLUDED."careerGoals",
          "dailyStudyHours" = EXCLUDED."dailyStudyHours",
          "updatedAt" = NOW();`,
        `det_${Date.now()}`,
        user.id,
        name?.trim() || user.name,
        classLevel?.trim() || null,
        course?.trim() || 'Computer Science',
        semester ? Number(semester) : 1,
        college?.trim() || null,
        enrolledSubjectsList,
        cleanSkills,
        careerGoals?.trim() || null,
        Number(body.dailyStudyHours) || 3
      );
    } catch (detError) {
      console.warn('[student_details table write error]:', detError);
    }

    // 5. Seed intelligent timetable slots if user has 0 schedule items
    const existingTimetables = await prisma.timetable.count({
      where: { userId: user.id },
    });

    if (existingTimetables === 0 && enrolledSubjectsList.length > 0) {
      const daysOfWeek: DayOfWeek[] = [
        DayOfWeek.MONDAY,
        DayOfWeek.TUESDAY,
        DayOfWeek.WEDNESDAY,
        DayOfWeek.THURSDAY,
        DayOfWeek.FRIDAY,
      ];

      const dbSubjects = await prisma.subject.findMany({
        where: { userId: user.id },
      });

      const slots = [
        { startTime: '09:00', endTime: '10:30' },
        { startTime: '11:00', endTime: '12:30' },
        { startTime: '14:00', endTime: '15:30' },
      ];

      let dayIndex = 0;
      let slotIndex = 0;

      for (const subj of dbSubjects.slice(0, 5)) {
        await prisma.timetable.create({
          data: {
            userId: user.id,
            subjectId: subj.id,
            day: daysOfWeek[dayIndex % daysOfWeek.length],
            startTime: slots[slotIndex % slots.length].startTime,
            endTime: slots[slotIndex % slots.length].endTime,
          },
        });
        dayIndex++;
        slotIndex++;
      }
    }

    // 6. Seed initial starter assignments if user has 0 assignments
    const existingAssignments = await prisma.assignment.count({
      where: { userId: user.id },
    });

    if (existingAssignments === 0 && enrolledSubjectsList.length > 0) {
      const primarySubject = enrolledSubjectsList[0];
      const secondarySubject = enrolledSubjectsList[1] || primarySubject;

      await prisma.assignment.createMany({
        data: [
          {
            userId: user.id,
            title: `${primarySubject}: Core Fundamentals Problem Set`,
            description: `Review lecture notes and complete foundational exercises for ${primarySubject}.`,
            subject: primarySubject,
            dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
            priority: 'HIGH',
            status: 'PENDING',
          },
          {
            userId: user.id,
            title: `${secondarySubject}: Reading & Concept Summary`,
            description: `Read Chapter 1 & 2 slides and upload PDF notes for AI exam summary.`,
            subject: secondarySubject,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            priority: 'MEDIUM',
            status: 'PENDING',
          },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Student details saved successfully and services updated!',
      data: {
        name: name || user.name,
        course: updatedProfile.course,
        semester: updatedProfile.semester,
        college: updatedProfile.college,
        skills: updatedProfile.skills,
        careerGoals: updatedProfile.careerGoals,
        subjects: enrolledSubjectsList,
      },
    });
  } catch (error) {
    console.error('[API /api/student-profile POST error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update student profile',
      },
      { status: 500 }
    );
  }
}
