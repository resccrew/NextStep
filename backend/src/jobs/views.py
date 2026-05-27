from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from jobs.tasks import scrape_all_sources_sequential_task
from .pagination import JobPagination
from .models import Job, SearchQueryCache
from .serializers import JobSerializer, SearchQueryCacheSerializer


class JobListView(generics.ListAPIView):
    serializer_class = JobSerializer
    permission_classes = [AllowAny]
    pagination_class = JobPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['work_mode', 'employment_type']
    search_fields = ['title', 'company__name', 'tags']

    def get_queryset(self):
        return Job.objects.filter(is_active=True).select_related('company', 'source')


class JobDetailView(generics.RetrieveAPIView):
    serializer_class = JobSerializer
    permission_classes = [AllowAny]
    queryset = Job.objects.filter(is_active=True).select_related('company')


def _get_jobs_for_query(query, work_mode=''):
    from django.db.models import Q

    QUERY_MAP = {
        'frontend': ['frontend', 'react', 'vue', 'angular', 'javascript'],
        'backend': ['backend', 'python', 'java', 'php', 'node'],
        'data': ['data', 'analityk', 'postgresql', 'sql', 'baz danych'],
        'devops': ['devops', 'linux', 'docker', 'kubernetes', 'administrator'],
        'designer': ['designer', 'ux', 'ui', 'figma', 'grafik'],
        'qa': ['qa', 'tester', 'quality'],
        'mobile': ['android', 'ios', 'kotlin', 'swift', 'mobile'],
    }

    search_terms = QUERY_MAP.get(query.lower(), [query])

    q_filter = Q()
    for term in search_terms:
        q_filter |= Q(title__icontains=term)
        q_filter |= Q(tags__icontains=term)
        q_filter |= Q(description__icontains=term)

    jobs_qs = Job.objects.filter(
        is_active=True
    ).filter(q_filter).select_related('company', 'source')

    if work_mode:
        jobs_qs = jobs_qs.filter(work_mode=work_mode)

    return jobs_qs


@api_view(['GET'])
@permission_classes([AllowAny])
def search_jobs(request):
    query = request.query_params.get('q', '').strip().lower()
    if not query:
        return Response({'error': 'Query parameter "q" is required.'}, status=400)

    work_mode = request.query_params.get('work_mode', '')
    cache_entry = SearchQueryCache.objects.filter(query_text=query).first()

    if cache_entry and cache_entry.status == 'completed' and cache_entry.is_fresh():
        jobs_qs = _get_jobs_for_query(query, work_mode)
        paginator = JobPagination()
        page = paginator.paginate_queryset(jobs_qs, request)
        serializer = JobSerializer(page, many=True)
        return Response({
            'status': 'completed',
            'source': 'cache',
            'count': paginator.page.paginator.count,
            'next': paginator.get_next_link(),
            'previous': paginator.get_previous_link(),
            'results': serializer.data,
        })

    if cache_entry and cache_entry.status == 'pending':
        from django.utils import timezone
        from datetime import timedelta
        stuck = (timezone.now() - cache_entry.updated_at) > timedelta(minutes=5)
        if not stuck:
            return Response({'status': 'pending', 'message': 'Scraping in progress.'})

    from .tasks import scrape_keyword
    SearchQueryCache.objects.update_or_create(
        query_text=query,
        defaults={'status': 'pending'}
    )
    task = scrape_all_sources_sequential_task.delay([query])
    print(f"[SEARCH] Task sent: {task.id} for query='{query}'")

    return Response({
        'status': 'pending',
        'task_id': str(task.id),
        'message': f'Scraping started for "{query}".',
    }, status=202)


@api_view(['GET'])
@permission_classes([AllowAny])
def search_status(request):
    query = request.query_params.get('q', '').strip().lower()
    if not query:
        return Response({'error': 'Missing "q" parameter.'}, status=400)

    cache_entry = SearchQueryCache.objects.filter(query_text=query).first()
    if not cache_entry:
        return Response({'status': 'not_found'}, status=404)

    if cache_entry.status == 'completed':
        work_mode = request.query_params.get('work_mode', '')
        jobs_qs = _get_jobs_for_query(query, work_mode)
        paginator = JobPagination()
        page = paginator.paginate_queryset(jobs_qs, request)
        serializer = JobSerializer(page, many=True)
        return Response({
            'status': 'completed',
            'count': paginator.page.paginator.count,
            'next': paginator.get_next_link(),
            'previous': paginator.get_previous_link(),
            'results': serializer.data,
        })

    return Response({
        'status': cache_entry.status,
        'updated_at': cache_entry.updated_at,
    })