package com.learningplatform.course;

import com.LearningPlatformApplication.course.Course;
import com.LearningPlatformApplication.course.CourseMapper;
import com.LearningPlatformApplication.course.CourseRepository;
import com.LearningPlatformApplication.course.CourseService;
import com.LearningPlatformApplication.enrollment.EnrollmentRepository;
import com.LearningPlatformApplication.enrollment.EnrollmentService;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

public class CourseServiceTest {

    @Test
    void deleteCourseShouldSoftDeleteCourseAndNotDeleteRelatedTables() {
        CourseRepository courseRepository = mock(CourseRepository.class);
        CourseMapper courseMapper = mock(CourseMapper.class);
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        EnrollmentRepository enrollmentRepository = mock(EnrollmentRepository.class);
        EnrollmentService enrollmentService = mock(EnrollmentService.class);

        CourseService courseService = new CourseService(
                courseRepository,
                courseMapper,
                jdbcTemplate,
                enrollmentRepository,
                enrollmentService
        );

        UUID courseId = UUID.randomUUID();
        Course course = new Course();
        course.setId(courseId);
        course.setStatus("PUBLISHED");

        when(courseRepository.existsById(courseId)).thenReturn(true);
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> invocation.getArgument(0));

        courseService.deleteCourse(courseId);

        assertEquals("DELETED", course.getStatus());
        verify(courseRepository).save(course);
    }
}
